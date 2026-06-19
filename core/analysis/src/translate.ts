import { Matrix4, Quaternion, Vector3 } from 'three'
import type {
  EndRelease,
  LoadCase,
  Material,
  MemberDistLoad,
  MemberEndReleases,
  ModelMember,
  ModelNode,
  Section,
  StructuralModel,
  Support,
} from './model'

// ── Physical constants ────────────────────────────────────────────────────────

// 40 mm universal grid: 1 grid unit = 0.04 m
const GRID_UNIT_M = 0.04

// Ply_120x800 panel height (fixed by variant — 800 mm)
const PANEL_HEIGHT_M = 0.8

// Node deduplication tolerance: 1 mm
const TOL = 0.001

// ── Section properties (SI: m², m⁴) ──────────────────────────────────────────

// Timber 120 × 120 SG8 — square solid section
// A  = 120² mm²   = 0.0144 m²
// Iy = Iz = 120⁴/12 mm⁴ = 1.728 × 10⁻⁵ m⁴
// J  = 0.1406 × 120⁴ mm⁴ ≈ 2.92 × 10⁻⁵ m⁴  (St-Venant, square)
const TIMBER_SECTION: Section = {
  A: 0.0144,
  Iy: 1.728e-5,
  Iz: 1.728e-5,
  J: 2.92e-5,
}

// Ply_120x800 — equivalent deep-beam properties for a solid 120 mm × 800 mm rectangle
// depth (span-perpendicular, Y local) = 120 mm = 0.12 m
// height (vertical Z) = 800 mm = 0.80 m
// Iy = b_depth × h_vert³ / 12 = 0.12 × 0.8³ / 12 = 5.12 × 10⁻³ m⁴  (strong, gravity)
// Iz = h_vert × b_depth³ / 12 = 0.80 × 0.12³ / 12 = 1.152 × 10⁻⁴ m⁴ (weak, lateral)
// J  ≈ (b³h/3)(1 − 0.63 b/h + …) for b=0.12, h=0.80  ≈ 4.17 × 10⁻⁴ m⁴
const PANEL_SECTION: Section = {
  A: 0.096,
  Iy: 5.12e-3,
  Iz: 1.152e-4,
  J: 4.17e-4,
}

// ── Material properties (SI: Pa) ─────────────────────────────────────────────

// NZ/AS 1720.1 SG8 structural timber: E₀ = 8000 MPa, G = 500 MPa
const TIMBER_MATERIAL: Material = { E: 8e9, G: 5e8 }

// Structural plywood (face grain): E₀ = 9500 MPa, G = 3800 MPa
const PANEL_MATERIAL: Material = { E: 9.5e9, G: 3.8e9 }

// ── Self-weight densities (kg/m³) ─────────────────────────────────────────────
const GRAVITY = 9.81 // m/s²
const TIMBER_DENSITY = 500 // kg/m³ SG8
const PLY_DENSITY = 600 // kg/m³ structural ply

// ── End-release helpers ──────────────────────────────────────────────────────

const NO_RELEASE: EndRelease = { Mxx: false, Myy: false, Mzz: false }
const RIGID: MemberEndReleases = { start: NO_RELEASE, end: NO_RELEASE }

// ── Input type (structural duck-typing) ──────────────────────────────────────

type AnyCreator = {
  spec: { type: string; lengthInGrids: number }
  id?: string
  transform: number[]
}

type AnyParts = Array<AnyCreator | false | null | undefined | AnyParts>

type Vec3 = { x: number; y: number; z: number }

// ── Geometry helpers ─────────────────────────────────────────────────────────

function flattenParts(parts: AnyParts): AnyCreator[] {
  const out: AnyCreator[] = []
  for (const p of parts) {
    if (p == null || p === false) continue
    if (Array.isArray(p)) out.push(...flattenParts(p))
    else out.push(p)
  }
  return out
}

function decomposeTransform(transform: number[]): {
  position: Vec3
  quaternion: { x: number; y: number; z: number; w: number }
} {
  const m = new Matrix4().fromArray(transform)
  const pos = new Vector3()
  const q = new Quaternion()
  const s = new Vector3()
  m.decompose(pos, q, s)
  return {
    position: { x: pos.x, y: pos.y, z: pos.z },
    quaternion: { x: q.x, y: q.y, z: q.z, w: q.w },
  }
}

function getMemberAxis(transform: number[]): Vec3 {
  const { quaternion: q } = decomposeTransform(transform)
  const dir = new Vector3(1, 0, 0).applyQuaternion(new Quaternion(q.x, q.y, q.z, q.w))
  return { x: dir.x, y: dir.y, z: dir.z }
}

function posKey(v: Vec3): string {
  return [Math.round(v.x / TOL), Math.round(v.y / TOL), Math.round(v.z / TOL)].join(',')
}

function xyKey(v: Vec3): string {
  return `${Math.round(v.x / TOL)},${Math.round(v.y / TOL)}`
}

function roundTo(val: number): number {
  return Math.round(val / TOL) * TOL
}

function getEndpoints(creator: AnyCreator): [Vec3, Vec3] {
  const { position, quaternion: q } = decomposeTransform(creator.transform)
  const len = creator.spec.lengthInGrids * GRID_UNIT_M
  const dir = new Vector3(1, 0, 0).applyQuaternion(new Quaternion(q.x, q.y, q.z, q.w))
  const end: Vec3 = {
    x: position.x + dir.x * len,
    y: position.y + dir.y * len,
    z: position.z + dir.z * len,
  }
  return [position, end]
}

// Returns true when the member local x-axis is aligned with world Z (vertical)
function isVertical(transform: number[]): boolean {
  const axis = getMemberAxis(transform)
  return Math.abs(Math.abs(axis.z) - 1) < 0.01
}

// ── Translator ───────────────────────────────────────────────────────────────

export function buildStructuralModel(parts: AnyParts): StructuralModel {
  const flat = flattenParts(parts)
  const timbers = flat.filter((p) => p.spec.type === 'timber')
  const panels = flat.filter((p) => p.spec.type === 'panel-brace')

  // Precompute panel endpoint data for intersection checks
  type PanelData = {
    creator: AnyCreator
    start: Vec3
    end: Vec3
    startXyKey: string
    endXyKey: string
    bottomZ: number // world Z of panel bottom edge (= start.z)
  }
  const panelData: PanelData[] = panels.map((p) => {
    const [start, end] = getEndpoints(p)
    return {
      creator: p,
      start,
      end,
      startXyKey: xyKey(start),
      endXyKey: xyKey(end),
      bottomZ: roundTo(start.z),
    }
  })

  const nodeMap = new Map<string, ModelNode>()
  const members: ModelMember[] = []
  let nodeCount = 0
  let memberCount = 0

  function getOrCreate(pos: Vec3): ModelNode {
    const key = posKey(pos)
    let node = nodeMap.get(key)
    if (node == null) {
      node = { id: `n${nodeCount++}`, x: pos.x, y: pos.y, z: pos.z }
      nodeMap.set(key, node)
    }
    return node
  }

  // Step 1 — Vertical timber posts: split at panel junction z-values
  for (const timber of timbers) {
    if (!isVertical(timber.transform)) {
      // Non-vertical timber: emit as a single un-split member
      const [start, end] = getEndpoints(timber)
      const startNode = getOrCreate(start)
      const endNode = getOrCreate(end)
      members.push({
        id: `m${memberCount++}`,
        partId: timber.id ?? `timber-${memberCount}`,
        type: 'timber',
        startNodeId: startNode.id,
        endNodeId: endNode.id,
        section: TIMBER_SECTION,
        material: TIMBER_MATERIAL,
        endReleases: RIGID,
      })
      continue
    }

    const [tStart, tEnd] = getEndpoints(timber)
    const postXy = xyKey(tStart)
    const zMin = roundTo(Math.min(tStart.z, tEnd.z))
    const zMax = roundTo(Math.max(tStart.z, tEnd.z))

    // Collect z-values where panels attach to this post.
    // Connection at panel bottom edge (bottomZ) — the single moment-resisting node per panel end.
    const junctionZSet = new Set<number>([zMin, zMax])
    for (const pd of panelData) {
      if (pd.startXyKey === postXy || pd.endXyKey === postXy) {
        if (pd.bottomZ >= zMin && pd.bottomZ <= zMax) {
          junctionZSet.add(pd.bottomZ)
        }
        // Also add the panel top (bottomZ + height) if it falls within the post range
        const topZ = roundTo(pd.bottomZ + PANEL_HEIGHT_M)
        if (topZ >= zMin && topZ <= zMax) {
          junctionZSet.add(topZ)
        }
      }
    }

    const sortedZs = Array.from(junctionZSet).sort((a, b) => a - b)

    // Create all intermediate nodes for this post
    const postNodeIds: string[] = []
    for (const z of sortedZs) {
      const node = getOrCreate({ x: tStart.x, y: tStart.y, z })
      postNodeIds.push(node.id)
    }

    // Create one timber segment per adjacent pair of nodes
    for (let i = 0; i < postNodeIds.length - 1; i++) {
      const startId = postNodeIds[i]
      const endId = postNodeIds[i + 1]
      if (startId == null || endId == null) continue
      members.push({
        id: `m${memberCount++}`,
        partId: timber.id ?? `timber-${memberCount}`,
        type: 'timber',
        startNodeId: startId,
        endNodeId: endId,
        section: TIMBER_SECTION,
        material: TIMBER_MATERIAL,
        // All post segments are rigidly connected — the post is continuous.
        // Timber-to-timber pin connections (if any) would use { Myy: true, Mzz: true }
        // at the relevant end; that case does not arise in the house design.
        endReleases: RIGID,
      })
    }
  }

  // Step 2 — Panel brace members (fully moment-resisting at both ends, per CLAUDE.md)
  for (const pd of panelData) {
    const startNode = getOrCreate(pd.start)
    const endNode = getOrCreate(pd.end)
    members.push({
      id: `m${memberCount++}`,
      partId: pd.creator.id ?? `panel-brace-${memberCount}`,
      type: 'panel-brace',
      startNodeId: startNode.id,
      endNodeId: endNode.id,
      section: PANEL_SECTION,
      material: PANEL_MATERIAL,
      endReleases: RIGID,
    })
  }

  // Step 3 — Supports: idealised pin (DX DY DZ restrained, rotations free)
  // at all nodes lying on the global base plane (minimum z among post starts)
  const baseZ = Math.min(
    ...timbers
      .filter((t) => isVertical(t.transform))
      .map((t) => {
        const [s, e] = getEndpoints(t)
        return Math.min(s.z, e.z)
      }),
  )
  const supports: Support[] = Array.from(nodeMap.values())
    .filter((n) => Math.abs(n.z - baseZ) < TOL)
    .map((n) => ({
      nodeId: n.id,
      DX: true,
      DY: true,
      DZ: true,
      RX: false,
      RY: false,
      RZ: false,
    }))

  // Step 4 — Load cases: nominal self-weight (Phase 6 maps real load combinations)
  const memberDistLoads: MemberDistLoad[] = members.map((m) => {
    const isPanel = m.type === 'panel-brace'
    const density = isPanel ? PLY_DENSITY : TIMBER_DENSITY
    const area = isPanel ? PANEL_SECTION.A : TIMBER_SECTION.A
    const wSelf = -(density * GRAVITY * area) // N/m, downward (−Z)
    return { memberId: m.id, direction: 'Fz', w1: wSelf, w2: wSelf }
  })

  const loadCases: LoadCase[] = [
    {
      id: 'dead',
      name: 'Dead — nominal self-weight (placeholder; Phase 6 applies real loads)',
      nodeLoads: [],
      memberDistLoads,
    },
  ]

  return {
    disclaimer:
      'DESIGN-ITERATION AID ONLY. Output of a preliminary direct-stiffness model. ' +
      'Not a consented engineering design. Final sign-off requires a chartered structural ' +
      'engineer and PS1 under the NZ Building Act.',
    nodes: Array.from(nodeMap.values()),
    members,
    supports,
    loadCases,
  }
}
