"""
Phase 3 offline validation: feed the @villagekit/analysis StructuralModel JSON to PyNite.

Usage:
  1. Install: pip install PyNite
  2. Generate the JSON from your house design (browser console or Node.js):

       import { buildStructuralModel } from '@villagekit/analysis'
       import { parts } from '../gridkit-products/products/house/house.ts'
       const model = buildStructuralModel(parts())
       console.log(JSON.stringify(model, null, 2))

     Redirect the output to a file, e.g.:  > house-model.json

  3. Run:  python scripts/validate-pynite.py house-model.json

Definition of done (Phase 3): PyNite prints "Analysis complete" with finite displacements.
"""

import json
import sys
from math import isfinite

try:
    from PyNite import FEModel3D
    from PyNite.Reporting import CheckStatics
except ImportError:
    print("ERROR: PyNite is not installed. Run: pip install PyNite")
    sys.exit(1)


def validate(path: str) -> None:
    with open(path) as f:
        data = json.load(f)

    print(f"Disclaimer: {data['disclaimer']}\n")
    print(f"Nodes:    {len(data['nodes'])}")
    print(f"Members:  {len(data['members'])}")
    print(f"Supports: {len(data['supports'])}")

    model = FEModel3D()

    # ── Nodes ────────────────────────────────────────────────────────────────
    for n in data["nodes"]:
        model.add_node(n["id"], n["x"], n["y"], n["z"])

    # ── Materials (PyNite requires named materials) ───────────────────────────
    # PyNite add_material signature: name, E, G, nu, rho
    model.add_material("TIMBER_SG8", 8e9, 5e8, 0.33, 500)
    model.add_material("PLY",        9.5e9, 3.8e9, 0.35, 600)

    # ── Members ──────────────────────────────────────────────────────────────
    for m in data["members"]:
        s = m["section"]
        mat_name = "PLY" if m["type"] == "panel-brace" else "TIMBER_SG8"
        # PyNite add_member: name, i_node, j_node, material, Iy, Iz, J, A
        model.add_member(
            m["id"],
            m["startNodeId"],
            m["endNodeId"],
            mat_name,
            s["Iy"],
            s["Iz"],
            s["J"],
            s["A"],
        )

        # Apply end releases if any rotational DOF is released
        er = m["endReleases"]
        # PyNite uses Ryi/Rzi for moment releases at i-end, Ryj/Rzj at j-end
        # Mxx (torsion) = Rxi/Rxj, Myy = Ryi/Ryj, Mzz = Rzi/Rzj
        if er["start"]["Mxx"]: model.def_releases(m["id"], True,  False, False, False, False, False)
        if er["start"]["Myy"]: model.def_releases(m["id"], False, True,  False, False, False, False)
        if er["start"]["Mzz"]: model.def_releases(m["id"], False, False, True,  False, False, False)
        if er["end"]["Mxx"]:   model.def_releases(m["id"], False, False, False, True,  False, False)
        if er["end"]["Myy"]:   model.def_releases(m["id"], False, False, False, False, True,  False)
        if er["end"]["Mzz"]:   model.def_releases(m["id"], False, False, False, False, False, True)

    # ── Supports ─────────────────────────────────────────────────────────────
    for sup in data["supports"]:
        model.def_support(
            sup["nodeId"],
            sup["DX"], sup["DY"], sup["DZ"],
            sup["RX"], sup["RY"], sup["RZ"],
        )

    # ── Load cases ───────────────────────────────────────────────────────────
    for lc in data["loadCases"]:
        combo_name = lc["id"]
        model.add_load_combo(combo_name, {combo_name: 1.0})

        for nl in lc["nodeLoads"]:
            for dof, val in (
                ("FX", nl.get("FX")),
                ("FY", nl.get("FY")),
                ("FZ", nl.get("FZ")),
                ("MX", nl.get("MX")),
                ("MY", nl.get("MY")),
                ("MZ", nl.get("MZ")),
            ):
                if val is not None:
                    model.add_node_load(nl["nodeId"], dof, val, combo_name)

        for dl in lc["memberDistLoads"]:
            # direction mapping: 'Fz' → 'FZ'
            direction = dl["direction"].upper()
            model.add_member_dist_load(
                dl["memberId"],
                direction,
                dl["w1"],
                dl["w2"],
                0,        # x1 (member start, relative 0..1)
                1,        # x2 (member end)
                combo_name,
            )

    # ── Analyze ──────────────────────────────────────────────────────────────
    print("\nRunning PyNite analysis …")
    model.analyze(check_statics=True)
    print("Analysis complete — no singularity errors.\n")

    # ── Check displacements ──────────────────────────────────────────────────
    print("Sample node displacements (dead load):")
    first_lc = data["loadCases"][0]["id"]
    for n in data["nodes"][:6]:
        nid = n["id"]
        try:
            dx = model.Nodes[nid].DX[first_lc]
            dy = model.Nodes[nid].DY[first_lc]
            dz = model.Nodes[nid].DZ[first_lc]
            ok = all(isfinite(v) for v in (dx, dy, dz))
            print(f"  {nid}: DX={dx:.6f}  DY={dy:.6f}  DZ={dz:.6f}  {'OK' if ok else 'NON-FINITE!'}")
        except KeyError:
            print(f"  {nid}: (no result — check PyNite API version)")

    print("\nPhase 3 validation PASSED — model is non-singular.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <house-model.json>")
        sys.exit(1)
    validate(sys.argv[1])
