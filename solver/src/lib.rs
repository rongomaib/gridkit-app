/*
 * gridkit-solver — linear elastic 3D direct-stiffness frame solver
 * EUPL-1.2  (c) 2026 rongomaib / gridkit-app contributors
 *
 * Implements the classical 12-DOF Timoshenko/Euler-Bernoulli space-frame element.
 * Each node has 6 DOFs: [DX, DY, DZ, RX, RY, RZ].
 * Supports uniform distributed member loads (converted to consistent nodal loads).
 * Solves Kd = f via Cholesky on the condensed (supported) system.
 */

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ── Input types (mirror @villagekit/analysis StructuralModel) ───────────────

#[derive(Deserialize)]
struct InputNode {
    id: String,
    x: f64,
    y: f64,
    z: f64,
}

#[derive(Deserialize)]
struct InputSection {
    #[serde(rename = "A")]
    a: f64,
    #[serde(rename = "Iy")]
    iy: f64,
    #[serde(rename = "Iz")]
    iz: f64,
    #[serde(rename = "J")]
    j: f64,
}

#[derive(Deserialize)]
struct InputMaterial {
    #[serde(rename = "E")]
    e: f64,
    #[serde(rename = "G")]
    g: f64,
}

// Phase 7 hardening: wire end releases into element stiffness (penalty / static condensation).
#[allow(dead_code)]
#[derive(Deserialize)]
struct InputEndRelease {
    #[serde(rename = "Mxx")]
    mxx: bool,
    #[serde(rename = "Myy")]
    myy: bool,
    #[serde(rename = "Mzz")]
    mzz: bool,
}

#[allow(dead_code)]
#[derive(Deserialize)]
struct InputEndReleases {
    start: InputEndRelease,
    end: InputEndRelease,
}

#[derive(Deserialize)]
struct InputMember {
    id: String,
    #[serde(rename = "partId")]
    part_id: String,
    #[serde(rename = "startNodeId")]
    start_node_id: String,
    #[serde(rename = "endNodeId")]
    end_node_id: String,
    section: InputSection,
    material: InputMaterial,
    #[serde(rename = "endReleases")]
    #[allow(dead_code)]
    end_releases: InputEndReleases,
}

#[derive(Deserialize)]
struct InputSupport {
    #[serde(rename = "nodeId")]
    node_id: String,
    #[serde(rename = "DX")]
    dx: bool,
    #[serde(rename = "DY")]
    dy: bool,
    #[serde(rename = "DZ")]
    dz: bool,
    #[serde(rename = "RX")]
    rx: bool,
    #[serde(rename = "RY")]
    ry: bool,
    #[serde(rename = "RZ")]
    rz: bool,
}

#[derive(Deserialize)]
struct InputNodeLoad {
    #[serde(rename = "nodeId")]
    node_id: String,
    #[serde(rename = "FX")]
    fx: Option<f64>,
    #[serde(rename = "FY")]
    fy: Option<f64>,
    #[serde(rename = "FZ")]
    fz: Option<f64>,
    #[serde(rename = "MX")]
    mx: Option<f64>,
    #[serde(rename = "MY")]
    my: Option<f64>,
    #[serde(rename = "MZ")]
    mz: Option<f64>,
}

#[derive(Deserialize)]
struct InputMemberDistLoad {
    #[serde(rename = "memberId")]
    member_id: String,
    direction: String,
    w1: f64,
    w2: f64,
}

#[derive(Deserialize)]
struct InputLoadCase {
    id: String,
    #[serde(rename = "nodeLoads")]
    node_loads: Vec<InputNodeLoad>,
    #[serde(rename = "memberDistLoads")]
    member_dist_loads: Vec<InputMemberDistLoad>,
}

#[derive(Deserialize)]
struct InputModel {
    nodes: Vec<InputNode>,
    members: Vec<InputMember>,
    supports: Vec<InputSupport>,
    #[serde(rename = "loadCases")]
    load_cases: Vec<InputLoadCase>,
}

// ── Output types ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct NodeDisplacement {
    #[serde(rename = "nodeId")]
    node_id: String,
    #[serde(rename = "DX")]
    dx: f64,
    #[serde(rename = "DY")]
    dy: f64,
    #[serde(rename = "DZ")]
    dz: f64,
    #[serde(rename = "RX")]
    rx: f64,
    #[serde(rename = "RY")]
    ry: f64,
    #[serde(rename = "RZ")]
    rz: f64,
}

#[derive(Serialize)]
pub struct MemberEndForces {
    // local member coordinates: x = member axis
    pub fx_start: f64,
    pub fy_start: f64,
    pub fz_start: f64,
    pub mx_start: f64,
    pub my_start: f64,
    pub mz_start: f64,
    pub fx_end: f64,
    pub fy_end: f64,
    pub fz_end: f64,
    pub mx_end: f64,
    pub my_end: f64,
    pub mz_end: f64,
}

#[derive(Serialize)]
pub struct MemberResult {
    #[serde(rename = "memberId")]
    member_id: String,
    #[serde(rename = "partId")]
    part_id: String,
    pub forces: MemberEndForces,
}

#[derive(Serialize)]
pub struct Reaction {
    #[serde(rename = "nodeId")]
    node_id: String,
    #[serde(rename = "FX")]
    fx: f64,
    #[serde(rename = "FY")]
    fy: f64,
    #[serde(rename = "FZ")]
    fz: f64,
    #[serde(rename = "MX")]
    mx: f64,
    #[serde(rename = "MY")]
    my: f64,
    #[serde(rename = "MZ")]
    mz: f64,
}

#[derive(Serialize)]
pub struct LoadCaseResult {
    #[serde(rename = "loadCaseId")]
    load_case_id: String,
    #[serde(rename = "nodeDisplacements")]
    node_displacements: Vec<NodeDisplacement>,
    #[serde(rename = "memberResults")]
    member_results: Vec<MemberResult>,
    pub reactions: Vec<Reaction>,
}

#[derive(Serialize)]
pub struct SolverResult {
    pub ok: bool,
    pub error: Option<String>,
    #[serde(rename = "loadCaseResults")]
    pub load_case_results: Vec<LoadCaseResult>,
}

// ── Dense matrix helpers (column-major, row-index first) ─────────────────────

struct Mat {
    rows: usize,
    cols: usize,
    data: Vec<f64>,
}

impl Mat {
    fn zeros(rows: usize, cols: usize) -> Self {
        Mat { rows, cols, data: vec![0.0; rows * cols] }
    }

    fn get(&self, r: usize, c: usize) -> f64 {
        self.data[r * self.cols + c]
    }

    fn set(&mut self, r: usize, c: usize, v: f64) {
        self.data[r * self.cols + c] = v;
    }

}

// ── 3D rotation matrix (3×3) for member local → global ───────────────────────
//
// Local x-axis = member axis direction.
// We need a consistent choice of local y and z.
// Standard approach: if member axis is not nearly vertical, use world Z cross local-x to get local-y.
// If nearly vertical, use world X cross local-x.

fn rotation_matrix(xi: f64, yi: f64, zi: f64, xj: f64, yj: f64, zj: f64) -> [[f64; 3]; 3] {
    let dx = xj - xi;
    let dy = yj - yi;
    let dz = zj - zi;
    let len = (dx * dx + dy * dy + dz * dz).sqrt();
    let lx = [dx / len, dy / len, dz / len];

    // Reference vector for local y construction
    let ref_v: [f64; 3] = if (lx[2].abs() - 1.0).abs() < 0.01 {
        [1.0, 0.0, 0.0] // member is vertical: use world X
    } else {
        [0.0, 0.0, 1.0] // otherwise: use world Z
    };

    // local z = lx × ref_v, then local y = lz × lx
    let lz = cross(lx, ref_v);
    let lz_len = (lz[0] * lz[0] + lz[1] * lz[1] + lz[2] * lz[2]).sqrt();
    let lz = [lz[0] / lz_len, lz[1] / lz_len, lz[2] / lz_len];
    let ly = cross(lz, lx);

    [lx, ly, lz]
}

fn cross(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

// Build 12×12 transformation matrix T (local → global, expanded for 2 nodes × 6 DOF)
fn build_transform(rot: [[f64; 3]; 3]) -> Mat {
    let mut t = Mat::zeros(12, 12);
    for block in 0..4 {
        let offset = block * 3;
        for i in 0..3 {
            for j in 0..3 {
                t.set(offset + i, offset + j, rot[i][j]);
            }
        }
    }
    t
}

// ── 12×12 local element stiffness (Euler-Bernoulli 3D frame) ─────────────────
//
// DOF order per node: [u, v, w, θx, θy, θz] (axial, shear-y, shear-z, torsion, bend-y, bend-z)
// For the full 12-DOF element, nodes i=0..5, j=6..11.

fn local_stiffness(
    len: f64,
    e: f64,
    g: f64,
    a: f64,
    iy: f64,
    iz: f64,
    j: f64,
) -> Mat {
    let mut k = Mat::zeros(12, 12);
    let l = len;
    let l2 = l * l;
    let l3 = l * l * l;

    // Axial stiffness (DOF 0, 6)
    let ea_l = e * a / l;
    k.set(0, 0, ea_l); k.set(0, 6, -ea_l);
    k.set(6, 0, -ea_l); k.set(6, 6, ea_l);

    // Torsional stiffness (DOF 3, 9)
    let gj_l = g * j / l;
    k.set(3, 3, gj_l); k.set(3, 9, -gj_l);
    k.set(9, 3, -gj_l); k.set(9, 9, gj_l);

    // Bending about local z (v shear, θz rotation) — DOF 1,5,7,11
    // EIz bending: shear in local y (DOF 1,7), moment about local z (DOF 5,11)
    let eiz = e * iz;
    k.set(1, 1,  12.0 * eiz / l3); k.set(1, 5,   6.0 * eiz / l2);
    k.set(1, 7, -12.0 * eiz / l3); k.set(1, 11,  6.0 * eiz / l2);

    k.set(5, 1,   6.0 * eiz / l2); k.set(5, 5,   4.0 * eiz / l);
    k.set(5, 7,  -6.0 * eiz / l2); k.set(5, 11,  2.0 * eiz / l);

    k.set(7, 1, -12.0 * eiz / l3); k.set(7, 5,  -6.0 * eiz / l2);
    k.set(7, 7,  12.0 * eiz / l3); k.set(7, 11, -6.0 * eiz / l2);

    k.set(11, 1,  6.0 * eiz / l2); k.set(11, 5,  2.0 * eiz / l);
    k.set(11, 7, -6.0 * eiz / l2); k.set(11, 11, 4.0 * eiz / l);

    // Bending about local y (w shear, θy rotation) — DOF 2,4,8,10
    // EIy bending: shear in local z (DOF 2,8), moment about local y (DOF 4,10)
    let eiy = e * iy;
    k.set(2, 2,  12.0 * eiy / l3); k.set(2, 4,  -6.0 * eiy / l2);
    k.set(2, 8, -12.0 * eiy / l3); k.set(2, 10, -6.0 * eiy / l2);

    k.set(4, 2,  -6.0 * eiy / l2); k.set(4, 4,   4.0 * eiy / l);
    k.set(4, 8,   6.0 * eiy / l2); k.set(4, 10,  2.0 * eiy / l);

    k.set(8, 2, -12.0 * eiy / l3); k.set(8, 4,   6.0 * eiy / l2);
    k.set(8, 8,  12.0 * eiy / l3); k.set(8, 10,  6.0 * eiy / l2);

    k.set(10, 2, -6.0 * eiy / l2); k.set(10, 4,  2.0 * eiy / l);
    k.set(10, 8,  6.0 * eiy / l2); k.set(10, 10, 4.0 * eiy / l);

    k
}

// ── Matrix multiply A * B → C ─────────────────────────────────────────────────

fn mat_mul(a: &Mat, b: &Mat) -> Mat {
    assert_eq!(a.cols, b.rows);
    let mut c = Mat::zeros(a.rows, b.cols);
    for i in 0..a.rows {
        for k in 0..a.cols {
            let aik = a.get(i, k);
            if aik == 0.0 { continue; }
            for j in 0..b.cols {
                let prev = c.get(i, j);
                c.set(i, j, prev + aik * b.get(k, j));
            }
        }
    }
    c
}

// A^T * B
fn mat_mul_at_b(a: &Mat, b: &Mat) -> Mat {
    assert_eq!(a.rows, b.rows);
    let mut c = Mat::zeros(a.cols, b.cols);
    for k in 0..a.rows {
        for i in 0..a.cols {
            let aki = a.get(k, i);
            if aki == 0.0 { continue; }
            for j in 0..b.cols {
                let prev = c.get(i, j);
                c.set(i, j, prev + aki * b.get(k, j));
            }
        }
    }
    c
}

// ── Consistent nodal loads for uniform distributed load ───────────────────────
//
// For a uniform distributed load w (N/m) in local direction d (0=x,1=y,2=z),
// the consistent fixed-end forces are:
//   axial (d=0): each end gets wL/2
//   transverse-y (d=1): shears wL/2 at each end, moments ±wL²/12
//   transverse-z (d=2): shears wL/2 at each end, moments ∓wL²/12

fn fixed_end_loads_uniform(dir: usize, w: f64, l: f64) -> [f64; 12] {
    let mut f = [0.0f64; 12];
    match dir {
        0 => {
            // axial — distributed axial load → equal end forces
            f[0] = w * l / 2.0;
            f[6] = w * l / 2.0;
        }
        1 => {
            // transverse-y (local v)
            f[1] = w * l / 2.0;
            f[5] = w * l * l / 12.0;
            f[7] = w * l / 2.0;
            f[11] = -w * l * l / 12.0;
        }
        2 => {
            // transverse-z (local w)
            f[2] = w * l / 2.0;
            f[4] = -w * l * l / 12.0;
            f[8] = w * l / 2.0;
            f[10] = w * l * l / 12.0;
        }
        _ => {}
    }
    f
}

// ── Cholesky decomposition (upper triangular, in-place on symmetric K) ────────
//
// Solves K x = f for symmetric positive-definite K.
// Returns Err if K is not positive-definite (structural mechanism).

fn cholesky_solve(k: &mut Vec<f64>, f: &mut Vec<f64>, n: usize) -> Result<(), String> {
    // Cholesky-Banachiewicz: compute lower triangular L such that K = L L^T
    for i in 0..n {
        for j in 0..=i {
            let mut s = k[i * n + j];
            for p in 0..j {
                s -= k[i * n + p] * k[j * n + p];
            }
            if i == j {
                if s <= 0.0 {
                    return Err(format!(
                        "Matrix is not positive-definite at diagonal ({i},{i}): s={s:.3e}. \
                        Check supports are sufficient to prevent rigid-body motion."
                    ));
                }
                k[i * n + i] = s.sqrt();
            } else {
                k[i * n + j] = s / k[j * n + j];
            }
        }
    }
    // Forward substitution: L y = f
    for i in 0..n {
        let mut s = f[i];
        for j in 0..i {
            s -= k[i * n + j] * f[j];
        }
        f[i] = s / k[i * n + i];
    }
    // Back substitution: L^T x = y
    for i in (0..n).rev() {
        let mut s = f[i];
        for j in (i + 1)..n {
            s -= k[j * n + i] * f[j];
        }
        f[i] = s / k[i * n + i];
    }
    Ok(())
}

// ── Main solver ───────────────────────────────────────────────────────────────

fn solve_model(model: &InputModel) -> Result<Vec<LoadCaseResult>, String> {
    let n_nodes = model.nodes.len();
    let n_dof = n_nodes * 6;

    // Map node id → index
    let node_idx: std::collections::HashMap<&str, usize> = model
        .nodes
        .iter()
        .enumerate()
        .map(|(i, n)| (n.id.as_str(), i))
        .collect();

    // Identify constrained DOFs from supports
    let mut constrained = vec![false; n_dof];
    for sup in &model.supports {
        let idx = *node_idx
            .get(sup.node_id.as_str())
            .ok_or_else(|| format!("Support references unknown node: {}", sup.node_id))?;
        let base = idx * 6;
        if sup.dx { constrained[base] = true; }
        if sup.dy { constrained[base + 1] = true; }
        if sup.dz { constrained[base + 2] = true; }
        if sup.rx { constrained[base + 3] = true; }
        if sup.ry { constrained[base + 4] = true; }
        if sup.rz { constrained[base + 5] = true; }
    }

    // Free DOF mapping: global → reduced, and reverse
    let free_dofs: Vec<usize> = (0..n_dof).filter(|&d| !constrained[d]).collect();
    let n_free = free_dofs.len();
    let mut global_to_free = vec![usize::MAX; n_dof];
    for (fi, &gi) in free_dofs.iter().enumerate() {
        global_to_free[gi] = fi;
    }

    // Precompute per-member geometry + global stiffness contributions
    struct MemberData {
        node_i: usize,
        node_j: usize,
        len: f64,
        rot: [[f64; 3]; 3],
    }

    let mut member_data: Vec<MemberData> = Vec::with_capacity(model.members.len());

    // Assemble global stiffness (reduced — free DOFs only)
    let mut kg_global = vec![0.0f64; n_free * n_free];

    for mem in &model.members {
        let i_idx = *node_idx
            .get(mem.start_node_id.as_str())
            .ok_or_else(|| format!("Member {} references unknown node: {}", mem.id, mem.start_node_id))?;
        let j_idx = *node_idx
            .get(mem.end_node_id.as_str())
            .ok_or_else(|| format!("Member {} references unknown node: {}", mem.id, mem.end_node_id))?;

        let ni = &model.nodes[i_idx];
        let nj = &model.nodes[j_idx];

        let dx = nj.x - ni.x;
        let dy = nj.y - ni.y;
        let dz = nj.z - ni.z;
        let len = (dx * dx + dy * dy + dz * dz).sqrt();
        if len < 1e-9 {
            return Err(format!("Member {} has zero length", mem.id));
        }

        let rot = rotation_matrix(ni.x, ni.y, ni.z, nj.x, nj.y, nj.z);
        let t = build_transform(rot);

        let s = &mem.section;
        let mat = &mem.material;
        let kl = local_stiffness(len, mat.e, mat.g, s.a, s.iy, s.iz, s.j);

        // Kg = T^T * Kl * T
        let tmp = mat_mul(&kl, &t);
        let kg = mat_mul_at_b(&t, &tmp);

        // Assemble into global reduced stiffness
        let global_dofs = [
            i_idx * 6, i_idx * 6 + 1, i_idx * 6 + 2,
            i_idx * 6 + 3, i_idx * 6 + 4, i_idx * 6 + 5,
            j_idx * 6, j_idx * 6 + 1, j_idx * 6 + 2,
            j_idx * 6 + 3, j_idx * 6 + 4, j_idx * 6 + 5,
        ];

        for (li, &gi) in global_dofs.iter().enumerate() {
            if constrained[gi] { continue; }
            let fi = global_to_free[gi];
            for (lj, &gj) in global_dofs.iter().enumerate() {
                if constrained[gj] { continue; }
                let fj = global_to_free[gj];
                kg_global[fi * n_free + fj] += kg.get(li, lj);
            }
        }

        member_data.push(MemberData {
            node_i: i_idx,
            node_j: j_idx,
            len,
            rot,
        });
    }

    // Solve each load case
    let mut results = Vec::with_capacity(model.load_cases.len());

    for lc in &model.load_cases {
        // Build free-DOF force vector
        let mut f_free = vec![0.0f64; n_free];

        // Node loads
        for nl in &lc.node_loads {
            let idx = *node_idx
                .get(nl.node_id.as_str())
                .ok_or_else(|| format!("Node load references unknown node: {}", nl.node_id))?;
            let base = idx * 6;
            let vals = [nl.fx, nl.fy, nl.fz, nl.mx, nl.my, nl.mz];
            for (d, v) in vals.iter().enumerate() {
                if let Some(val) = v {
                    let gi = base + d;
                    if !constrained[gi] {
                        f_free[global_to_free[gi]] += val;
                    }
                }
            }
        }

        // Distributed member loads → consistent nodal loads
        for dl in &lc.member_dist_loads {
            let mem_idx = model
                .members
                .iter()
                .position(|m| m.id == dl.member_id)
                .ok_or_else(|| format!("Dist load references unknown member: {}", dl.member_id))?;

            let md = &member_data[mem_idx];
            let len = md.len;
            // Use average load magnitude (w1 ≈ w2 for uniform loads; linear variation not implemented)
            let w_avg = (dl.w1 + dl.w2) / 2.0;

            let local_dir = match dl.direction.to_uppercase().as_str() {
                "FX" => 0usize,
                "FY" => 1,
                "FZ" => 2,
                other => return Err(format!("Unknown dist load direction: {other}")),
            };

            let f_local = fixed_end_loads_uniform(local_dir, w_avg, len);

            // Transform local fixed-end forces to global
            let rot = md.rot;
            let t = build_transform(rot);

            // f_global = T^T * f_local  (T^T is global→local^T = local→global for orthogonal T)
            let mut f_global = [0.0f64; 12];
            for i in 0..12 {
                for j in 0..12 {
                    f_global[i] += t.get(j, i) * f_local[j];
                }
            }

            // Scatter to free DOF force vector
            let global_dofs = [
                md.node_i * 6, md.node_i * 6 + 1, md.node_i * 6 + 2,
                md.node_i * 6 + 3, md.node_i * 6 + 4, md.node_i * 6 + 5,
                md.node_j * 6, md.node_j * 6 + 1, md.node_j * 6 + 2,
                md.node_j * 6 + 3, md.node_j * 6 + 4, md.node_j * 6 + 5,
            ];
            for (li, &gi) in global_dofs.iter().enumerate() {
                if !constrained[gi] {
                    f_free[global_to_free[gi]] += f_global[li];
                }
            }
        }

        // Solve K_free * d_free = f_free
        let mut k_solve = kg_global.clone();
        cholesky_solve(&mut k_solve, &mut f_free, n_free)?;
        let d_free = f_free; // renamed after solve

        // Reconstruct full displacement vector
        let mut d_full = vec![0.0f64; n_dof];
        for (fi, &gi) in free_dofs.iter().enumerate() {
            d_full[gi] = d_free[fi];
        }

        // Node displacements
        let node_displacements: Vec<NodeDisplacement> = model
            .nodes
            .iter()
            .enumerate()
            .map(|(i, n)| {
                let base = i * 6;
                NodeDisplacement {
                    node_id: n.id.clone(),
                    dx: d_full[base],
                    dy: d_full[base + 1],
                    dz: d_full[base + 2],
                    rx: d_full[base + 3],
                    ry: d_full[base + 4],
                    rz: d_full[base + 5],
                }
            })
            .collect();

        // Member forces and reactions
        let mut member_results = Vec::with_capacity(model.members.len());
        let mut reaction_map: std::collections::HashMap<usize, [f64; 6]> =
            std::collections::HashMap::new();

        for (mem_idx, mem) in model.members.iter().enumerate() {
            let md = &member_data[mem_idx];
            let t = build_transform(md.rot);

            // Element global displacements
            let global_dofs = [
                md.node_i * 6, md.node_i * 6 + 1, md.node_i * 6 + 2,
                md.node_i * 6 + 3, md.node_i * 6 + 4, md.node_i * 6 + 5,
                md.node_j * 6, md.node_j * 6 + 1, md.node_j * 6 + 2,
                md.node_j * 6 + 3, md.node_j * 6 + 4, md.node_j * 6 + 5,
            ];

            let d_elem: [f64; 12] = std::array::from_fn(|i| d_full[global_dofs[i]]);

            // Local displacements: d_local = T * d_global
            let mut d_local = [0.0f64; 12];
            for i in 0..12 {
                for j in 0..12 {
                    d_local[i] += t.get(i, j) * d_elem[j];
                }
            }

            // Local forces: f_local = Kl * d_local
            let s = &mem.section;
            let mat = &mem.material;
            let kl = local_stiffness(md.len, mat.e, mat.g, s.a, s.iy, s.iz, s.j);

            let mut f_local = [0.0f64; 12];
            for i in 0..12 {
                for j in 0..12 {
                    f_local[i] += kl.get(i, j) * d_local[j];
                }
            }

            // Add fixed-end forces from distributed loads for this member in this load case
            for dl in &lc.member_dist_loads {
                if dl.member_id != mem.id { continue; }
                let w_avg = (dl.w1 + dl.w2) / 2.0;
                let local_dir = match dl.direction.to_uppercase().as_str() {
                    "FX" => 0usize, "FY" => 1, "FZ" => 2, _ => continue,
                };
                let fef = fixed_end_loads_uniform(local_dir, w_avg, md.len);
                // Member forces = Kl*d_local - FEF (subtract fixed-end load, convention: FEF is what the structure applies to member)
                for k in 0..12 {
                    f_local[k] -= fef[k];
                }
            }

            // Accumulate reactions at constrained nodes
            let mut f_global_elem = [0.0f64; 12];
            for i in 0..12 {
                for j in 0..12 {
                    f_global_elem[i] += t.get(j, i) * f_local[j];
                }
            }
            for (li, &gi) in global_dofs.iter().enumerate() {
                if constrained[gi] {
                    let node = gi / 6;
                    let dof = gi % 6;
                    let entry = reaction_map.entry(node).or_insert([0.0; 6]);
                    entry[dof] += f_global_elem[li];
                }
            }

            member_results.push(MemberResult {
                member_id: mem.id.clone(),
                part_id: mem.part_id.clone(),
                forces: MemberEndForces {
                    fx_start: f_local[0],
                    fy_start: f_local[1],
                    fz_start: f_local[2],
                    mx_start: f_local[3],
                    my_start: f_local[4],
                    mz_start: f_local[5],
                    fx_end:   f_local[6],
                    fy_end:   f_local[7],
                    fz_end:   f_local[8],
                    mx_end:   f_local[9],
                    my_end:   f_local[10],
                    mz_end:   f_local[11],
                },
            });
        }

        let reactions: Vec<Reaction> = model
            .supports
            .iter()
            .filter_map(|sup| {
                let idx = node_idx.get(sup.node_id.as_str())?;
                let r = reaction_map.get(idx)?;
                Some(Reaction {
                    node_id: sup.node_id.clone(),
                    fx: r[0],
                    fy: r[1],
                    fz: r[2],
                    mx: r[3],
                    my: r[4],
                    mz: r[5],
                })
            })
            .collect();

        results.push(LoadCaseResult {
            load_case_id: lc.id.clone(),
            node_displacements,
            member_results,
            reactions,
        });
    }

    Ok(results)
}

// ── WASM entry point ──────────────────────────────────────────────────────────

#[wasm_bindgen]
pub fn solve(model_json: &str) -> String {
    let result = (|| -> Result<Vec<LoadCaseResult>, String> {
        let model: InputModel = serde_json::from_str(model_json)
            .map_err(|e| format!("JSON parse error: {e}"))?;
        solve_model(&model)
    })();

    let output = match result {
        Ok(lc_results) => SolverResult {
            ok: true,
            error: None,
            load_case_results: lc_results,
        },
        Err(msg) => SolverResult {
            ok: false,
            error: Some(msg),
            load_case_results: vec![],
        },
    };

    serde_json::to_string(&output).unwrap_or_else(|e| {
        format!(r#"{{"ok":false,"error":"Serialization error: {e}","loadCaseResults":[]}}"#)
    })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Cantilever beam: 1m long, pinned at i, tip load at j.
    /// E=200e9, A=0.01, Iy=Iz=1e-5, J=2e-5, G=80e9
    /// Tip deflection under FZ=1000 N: δ = PL³/3EI = 1000×1³/(3×200e9×1e-5) = 1.667e-4 m
    #[test]
    fn test_cantilever_tip_deflection() {
        let model_json = r#"{
            "nodes": [
                {"id":"A","x":0,"y":0,"z":0},
                {"id":"B","x":1,"y":0,"z":0}
            ],
            "members": [{
                "id":"m0","partId":"p0","startNodeId":"A","endNodeId":"B",
                "section":{"A":0.01,"Iy":1e-5,"Iz":1e-5,"J":2e-5},
                "material":{"E":200e9,"G":80e9},
                "endReleases":{
                    "start":{"Mxx":false,"Myy":false,"Mzz":false},
                    "end":{"Mxx":false,"Myy":false,"Mzz":false}
                }
            }],
            "supports": [{
                "nodeId":"A","DX":true,"DY":true,"DZ":true,"RX":true,"RY":true,"RZ":true
            }],
            "loadCases": [{
                "id":"lc1","name":"tip load",
                "nodeLoads":[{"nodeId":"B","FZ":1000}],
                "memberDistLoads":[]
            }]
        }"#;

        let out = solve(model_json);
        let result: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert!(result["ok"].as_bool().unwrap(), "Solver failed: {}", result["error"]);

        let disps = &result["loadCaseResults"][0]["nodeDisplacements"];
        let dz_b = disps
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["nodeId"] == "B")
            .unwrap()["DZ"]
            .as_f64()
            .unwrap();

        let expected = 1.667e-4_f64;
        let rel_err = ((dz_b - expected) / expected).abs();
        assert!(
            rel_err < 1e-3,
            "Tip deflection {dz_b:.4e} differs from expected {expected:.4e} by {rel_err:.1e}"
        );
    }
}
