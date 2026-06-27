import { getMaterial } from '@villagekit/materials'
import { Matrix4, Quaternion, Vector3 } from 'three'
import type {
  EndRelease,
  LoadCase,
  MemberDistLoad,
  MemberEndReleases,
  ModelMember,
  ModelNode,
  NodeLoad,
  Section,
  StructuralModel,
  Support,
} from './model'

// Modelling assumptions (Phase 6b):
// - Vertical posts: 120x120 SG8 timber, continuous full height, split at panel junctions.
// - Panel braces: 120x800 structural ply, modelled as deep Euler-Bernoulli beams.
// - Post-to-panel connections: fully rigid (moment-resisting) per CLAUDE.md.
// - Base supports: fully fixed (DX DY DZ RZ restrained; RX RY = false per torsion note below).
// - Load cases: G (self-weight), Q (floor live), Wu (wind X), Eu (seismic X).
//   All lateral load intensities are INDICATIVE - a chartered engineer must verify.

// -- Physical constants ---------------------------------------------------------

// 40 mm universal grid: 1 grid unit = 0.04 m
const GRID_UNIT_M = 0.04

// Default panel height when spec doesn't carry heightInGrids (20 grids = 800 mm)
const DEFAULT_PANEL_HEIGHT_GRIDS = 20
const DEFAULT_PANEL_DEPTH_GRIDS = 3

// Node deduplication tolerance: 1 mm
const TOL = 0.001

// -- Section properties (SI: m2, m4) -------------------------------------------

// Timber 120 x 120 SG8 - square solid section
// A  = 120^2 mm^2   = 0.0144 m^2
// Iy = Iz = 120^4/12 mm^4 = 1.728e-5 m^4
// J  = 0.1406 x 120^4 mm^4 approx 2.92e-5 m^4  (St-Venant, square)
const TIMBER_SECTION: Section = {
  A: 0.0144,
  Iy: 1.728e-5,
  Iz: 1.728e-5,
  J: 2.92e-5,
}

// Compute panel section properties from actual dimensions.
// local y = world Z (height dim), local z = world -Y (depth dim).
// Iy = weak (out-of-plane): d^3 * h / 12
// Iz = strong (in-plane):   h^3 * d / 12
// J  ≈ b^3 * a / 3 * (1 - 0.63*b/a) for rectangle b<=a
function panelSection(heightM: number, depthM: number): Section {
  const h = heightM
  const d = depthM
  const b = Math.min(h, d)
  const a = Math.max(h, d)
  return {
    A: h * d,
    Iy: (d * d * d * h) / 12,
    Iz: (h * h * h * d) / 12,
    J: ((b * b * b * a) / 3) * (1 - 0.63 * (b / a)),
  }
}

// -- Self-weight ----------------------------------------------------------------
const GRAVITY = 9.81 // m/s^2

// -- End-release helpers --------------------------------------------------------

const NO_RELEASE: EndRelease = { Mxx: false, Myy: false, Mzz: false }
const RIGID: MemberEndReleases = { start: NO_RELEASE, end: NO_RELEASE }
const ALL_RELEASE: EndRelease = { Mxx: true, Myy: true, Mzz: true }
const PINNED: MemberEndReleases = { start: ALL_RELEASE, end: ALL_RELEASE }

// -- Input type (structural duck-typing) ----------------------------------------

type AnyCreator = {
  spec: {
    type: string
    lengthInGrids?: number
    widthInGrids?: number // wall-frame uses widthInGrids instead of lengthInGrids
    heightInGrids?: number
    depthInGrids?: number
    materialId?: string
  }
  id?: string
  transform: number[]
}

type AnyParts = Array<AnyCreator | false | null | undefined | AnyParts>

type Vec3 = { x: number; y: number; z: number }

// -- Geometry helpers -----------------------------------------------------------

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
  // Extract local X axis from the matrix first column directly.
  // Do NOT use quaternion decomposition: changeOfBasisTransform can produce
  // matrices with det=-1 (reflections). Three.js decompose flips scale_x for
  // det<0, corrupting the quaternion and yielding the wrong axis direction.
  const e = new Matrix4().fromArray(transform).elements
  const len = Math.hypot(e[0]!, e[1]!, e[2]!)
  if (len < 1e-10) return { x: 1, y: 0, z: 0 }
  return { x: e[0]! / len, y: e[1]! / len, z: e[2]! / len }
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
  const { position } = decomposeTransform(creator.transform)
  const lenGrids = creator.spec.lengthInGrids ?? creator.spec.widthInGrids ?? 0
  const len = lenGrids * GRID_UNIT_M
  // Use getMemberAxis (direct first-column read) rather than the quaternion from
  // decomposeTransform.  changeOfBasisTransform can produce det=-1 matrices (e.g.
  // xSpanTransform swaps Y↔Z), and Three.js decompose negates scale.x for det<0,
  // which corrupts the extracted quaternion: applyQuaternion([1,0,0]) then returns
  // [-1,0,0] instead of [1,0,0], placing the far endpoint in the wrong direction.
  const axis = getMemberAxis(creator.transform)
  const end: Vec3 = {
    x: position.x + axis.x * len,
    y: position.y + axis.y * len,
    z: position.z + axis.z * len,
  }
  return [position, end]
}

// Returns true when the member local x-axis is aligned with world Z (vertical)
function isVertical(transform: number[]): boolean {
  const axis = getMemberAxis(transform)
  return Math.abs(Math.abs(axis.z) - 1) < 0.01
}

// -- Translator -----------------------------------------------------------------

export function buildStructuralModel(parts: AnyParts): StructuralModel {
  const flat = flattenParts(parts)
  const timbers = flat.filter((p) => p.spec.type === 'timber' || p.spec.type === 'beam120')
  // panel-brace = purpose-built 120×800 ply deep beam; wall-frame = framed wall panel (also provides lateral stiffness)
  const panels = flat.filter((p) => p.spec.type === 'panel-brace' || p.spec.type === 'wall-frame')

  // Collect vertical post centroid XY positions for panel-endpoint snapping.
  // Panels are visually inset from post faces; the analysis model needs their endpoints
  // to share nodes with the post centrelines. Any panel end within POST_SNAP_M of a post
  // centroid (same XY, any Z) is snapped to that centroid so they share a deduped node.
  const POST_SNAP_M = 3 * GRID_UNIT_M // 120 mm - covers a 1-3 gu inset
  const postCentroids: { x: number; y: number }[] = timbers
    .filter((t) => isVertical(t.transform))
    .map((t) => {
      const [s] = getEndpoints(t)
      return { x: s.x, y: s.y }
    })

  function snapXyToPost(pos: Vec3): Vec3 {
    let best = Number.POSITIVE_INFINITY
    let sx = pos.x
    let sy = pos.y
    for (const pc of postCentroids) {
      const d = Math.hypot(pos.x - pc.x, pos.y - pc.y)
      // Use <= POST_SNAP_M + TOL so endpoints at exactly 3 gu (post face) are included.
      if (d < best && d <= POST_SNAP_M + TOL) {
        best = d
        sx = pc.x
        sy = pc.y
      }
    }
    return { x: sx, y: sy, z: pos.z }
  }

  // Returns true when an XY position (after snapping) coincides with a known post.
  // Used to exclude panel members whose endpoints don't reach a post — such members
  // create free-floating nodes and produce a near-singular stiffness matrix.
  function isAtPost(pos: Vec3): boolean {
    return postCentroids.some((pc) => Math.abs(pos.x - pc.x) < TOL && Math.abs(pos.y - pc.y) < TOL)
  }

  // Returns all post centroids whose XY lies strictly along a beam's axis between
  // start and end, sorted in travel order. Used to split beams that pass through
  // intermediate posts (e.g. roof beams with eave overhangs).
  function intermediatePostsOnBeam(start: Vec3, end: Vec3): Vec3[] {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const len = Math.hypot(dx, dy)
    if (len < TOL) return []
    const ax = dx / len
    const ay = dy / len
    const result: Vec3[] = []
    for (const pc of postCentroids) {
      const t = (pc.x - start.x) * ax + (pc.y - start.y) * ay
      if (t <= TOL || t >= len - TOL) continue
      const perpX = pc.x - start.x - t * ax
      const perpY = pc.y - start.y - t * ay
      if (Math.hypot(perpX, perpY) > TOL) continue
      result.push({ x: pc.x, y: pc.y, z: start.z })
    }
    result.sort((a, b) => {
      const ta = (a.x - start.x) * ax + (a.y - start.y) * ay
      const tb = (b.x - start.x) * ax + (b.y - start.y) * ay
      return ta - tb
    })
    return result
  }

  // Precompute panel endpoint data for intersection checks
  type PanelData = {
    creator: AnyCreator
    start: Vec3
    end: Vec3
    startXyKey: string
    endXyKey: string
    // Snapped versions: XY moved to nearest post centroid (Z unchanged).
    // Used for node creation so panels share nodes with posts even when visually inset.
    snappedStart: Vec3
    snappedEnd: Vec3
    snappedStartXyKey: string
    snappedEndXyKey: string
    bottomZ: number // world Z of panel bottom edge (= start.z)
    heightM: number // panel height in metres (from spec.heightInGrids)
    depthM: number // panel depth in metres (from spec.depthInGrids)
    spansPostToPost: boolean // both endpoints landed on a post after snapping
  }
  const panelData: PanelData[] = panels.map((p) => {
    const [start, end] = getEndpoints(p)
    const snappedStart = snapXyToPost(start)
    const snappedEnd = snapXyToPost(end)
    const heightM = (p.spec.heightInGrids ?? DEFAULT_PANEL_HEIGHT_GRIDS) * GRID_UNIT_M
    const depthM = (p.spec.depthInGrids ?? DEFAULT_PANEL_DEPTH_GRIDS) * GRID_UNIT_M
    return {
      creator: p,
      start,
      end,
      startXyKey: xyKey(start),
      endXyKey: xyKey(end),
      snappedStart,
      snappedEnd,
      snappedStartXyKey: xyKey(snappedStart),
      snappedEndXyKey: xyKey(snappedEnd),
      bottomZ: roundTo(start.z),
      heightM,
      depthM,
      spansPostToPost: isAtPost(snappedStart) && isAtPost(snappedEnd),
    }
  })

  const nodeMap = new Map<string, ModelNode>()
  const members: ModelMember[] = []
  const memberDensity = new Map<string, number>()
  let nodeCount = 0
  let memberCount = 0
  const panelHeightByPartId = new Map<string, number>(
    panelData.map((pd) => [pd.creator.id ?? '', pd.heightM]),
  )

  function getOrCreate(pos: Vec3): ModelNode {
    const key = posKey(pos)
    let node = nodeMap.get(key)
    if (node == null) {
      node = { id: `n${nodeCount++}`, x: pos.x, y: pos.y, z: pos.z }
      nodeMap.set(key, node)
    }
    return node
  }

  // Precompute non-vertical timber endpoint data so posts can be split at those junctions too.
  // Snap endpoints to post centroids so XY keys match the post key and beam-post junctions are detected.
  // Also store intermediate posts (posts whose XY lies on the beam's line between its endpoints)
  // so that pass-through beams (e.g. roof beams with eave overhangs) also split those posts.
  type HorizTimberData = {
    start: Vec3
    end: Vec3
    startXyKey: string
    endXyKey: string
    z: number
    intermediatePosts: Vec3[]
  }
  const horizTimberData: HorizTimberData[] = timbers
    .filter((t) => !isVertical(t.transform))
    .map((t) => {
      const [rawStart, rawEnd] = getEndpoints(t)
      const start = snapXyToPost(rawStart)
      const end = snapXyToPost(rawEnd)
      const intermediatePosts = intermediatePostsOnBeam(start, end)
      return {
        start,
        end,
        startXyKey: xyKey(start),
        endXyKey: xyKey(end),
        z: roundTo(start.z),
        intermediatePosts,
      }
    })

  // Step 1 - Vertical timber posts: split at panel junction z-values
  for (const timber of timbers) {
    if (!isVertical(timber.transform)) {
      // Non-vertical timber: snap endpoints and split at any intermediate posts on the beam's line.
      // This connects beams that pass through a post (e.g. roof beams with eave overhangs) to that post.
      const [rawStart, rawEnd] = getEndpoints(timber)
      const start = snapXyToPost(rawStart)
      const end = snapXyToPost(rawEnd)
      const intermediate = intermediatePostsOnBeam(start, end)
      const splitPoints = [start, ...intermediate, end]
      const timberMat = getMaterial(timber.spec.materialId, 'SG8')
      for (let i = 0; i < splitPoints.length - 1; i++) {
        const sNode = getOrCreate(splitPoints[i]!)
        const eNode = getOrCreate(splitPoints[i + 1]!)
        const memberId = `m${memberCount++}`
        members.push({
          id: memberId,
          partId: timber.id ?? `timber-${memberCount}`,
          type: 'timber',
          startNodeId: sNode.id,
          endNodeId: eNode.id,
          section: TIMBER_SECTION,
          material: { E: timberMat.E, G: timberMat.G },
          endReleases: RIGID,
        })
        memberDensity.set(memberId, timberMat.density)
      }
      continue
    }

    const [tStart, tEnd] = getEndpoints(timber)
    const postXy = xyKey(tStart)
    const zMin = roundTo(Math.min(tStart.z, tEnd.z))
    const zMax = roundTo(Math.max(tStart.z, tEnd.z))

    // Collect z-values where panels OR horizontal timbers attach to this post.
    const junctionZSet = new Set<number>([zMin, zMax])
    for (const pd of panelData) {
      if (pd.snappedStartXyKey === postXy || pd.snappedEndXyKey === postXy) {
        if (pd.bottomZ >= zMin && pd.bottomZ <= zMax) {
          junctionZSet.add(pd.bottomZ)
        }
        // Also add the panel top (bottomZ + height) if it falls within the post range
        const topZ = roundTo(pd.bottomZ + pd.heightM)
        if (topZ >= zMin && topZ <= zMax) {
          junctionZSet.add(topZ)
        }
      }
    }
    // Split post at z-heights where horizontal timbers (e.g. floor beams) connect.
    // Also check intermediate posts: beams that pass through this post without starting/ending here.
    for (const ht of horizTimberData) {
      if (ht.startXyKey === postXy || ht.endXyKey === postXy) {
        if (ht.z >= zMin && ht.z <= zMax) junctionZSet.add(ht.z)
      }
      for (const ip of ht.intermediatePosts) {
        if (xyKey(ip) === postXy && ht.z >= zMin && ht.z <= zMax) {
          junctionZSet.add(ht.z)
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

    const postMat = getMaterial(timber.spec.materialId, 'SG8')

    // Create one timber segment per adjacent pair of nodes
    for (let i = 0; i < postNodeIds.length - 1; i++) {
      const startId = postNodeIds[i]
      const endId = postNodeIds[i + 1]
      if (startId == null || endId == null) continue
      const memberId = `m${memberCount++}`
      members.push({
        id: memberId,
        partId: timber.id ?? `timber-${memberCount}`,
        type: 'timber',
        startNodeId: startId,
        endNodeId: endId,
        section: TIMBER_SECTION,
        material: { E: postMat.E, G: postMat.G },
        // All post segments are rigidly connected - the post is continuous.
        endReleases: RIGID,
      })
      memberDensity.set(memberId, postMat.density)
    }
  }

  // Step 2b - Bay aggregation: groups of co-planar wall-frame infill panels that collectively
  // span from post to post are emitted as a single structural panel-brace shear member.
  // [post][panel][panel][panel][post] → one shear wall member for the bay.
  // ENGINEERING NOTE: assumes adequate shear transfer at panel-panel and panel-post junctions.
  // A chartered engineer must verify connection capacities before relying on these results.
  {
    const bayGroups = new Map<string, PanelData[]>()
    for (const pd of panelData) {
      if (pd.creator.spec.type !== 'wall-frame') continue
      const dxAbs = Math.abs(pd.start.x - pd.end.x)
      const dyAbs = Math.abs(pd.start.y - pd.end.y)
      let direction: 'X' | 'Y'
      let planeCoord: number
      if (dyAbs < TOL) {
        direction = 'X'
        planeCoord = pd.start.y
      } else if (dxAbs < TOL) {
        direction = 'Y'
        planeCoord = pd.start.x
      } else {
        continue
      }
      const zBot = pd.bottomZ
      const zTop = Math.round((pd.bottomZ + pd.heightM) / TOL) * TOL
      const groupKey = JSON.stringify({
        direction,
        planeCoord: Math.round(planeCoord / TOL),
        zBot: Math.round(zBot / TOL),
        zTop: Math.round(zTop / TOL),
      })
      const existing = bayGroups.get(groupKey)
      if (existing) {
        existing.push(pd)
      } else {
        bayGroups.set(groupKey, [pd])
      }
    }

    for (const [keyStr, group] of bayGroups) {
      const key = JSON.parse(keyStr) as {
        direction: 'X' | 'Y'
        planeCoord: number
        zBot: number
        zTop: number
      }
      const direction = key.direction
      const planeCoord = key.planeCoord * TOL
      const zBot = key.zBot * TOL

      let spanMin = Number.POSITIVE_INFINITY
      let spanMax = Number.NEGATIVE_INFINITY
      for (const pd of group) {
        const aStart = direction === 'X' ? pd.start.x : pd.start.y
        const aEnd = direction === 'X' ? pd.end.x : pd.end.y
        if (aStart < spanMin) spanMin = aStart
        if (aStart > spanMax) spanMax = aStart
        if (aEnd < spanMin) spanMin = aEnd
        if (aEnd > spanMax) spanMax = aEnd
      }

      // X-brace: two pinned diagonals crossing the bay.
      // zBot and zTop are guaranteed junction nodes — Step 1 already split posts there
      // via pd.bottomZ and topZ. No floating nodes, no overlap with floor beams.
      const sectionH = group[0]!.heightM
      const zTop = zBot + sectionH

      const botMinPt: Vec3 =
        direction === 'X'
          ? { x: spanMin, y: planeCoord, z: zBot }
          : { x: planeCoord, y: spanMin, z: zBot }
      const botMaxPt: Vec3 =
        direction === 'X'
          ? { x: spanMax, y: planeCoord, z: zBot }
          : { x: planeCoord, y: spanMax, z: zBot }

      const sBotMin = snapXyToPost(botMinPt)
      const sBotMax = snapXyToPost(botMaxPt)
      if (!isAtPost(sBotMin) || !isAtPost(sBotMax)) continue

      const sTopMin = { ...sBotMin, z: zTop }
      const sTopMax = { ...sBotMax, z: zTop }

      const nodeBotMin = getOrCreate(sBotMin)
      const nodeBotMax = getOrCreate(sBotMax)
      const nodeTopMin = getOrCreate(sTopMin)
      const nodeTopMax = getOrCreate(sTopMax)

      const braceMat = getMaterial(undefined, 'F14')
      const syntheticId = `bay-brace-${direction}-${Math.round(planeCoord / TOL)}-${Math.round(zBot / TOL)}`

      const m1Id = `m${memberCount++}`
      members.push({
        id: m1Id,
        partId: `${syntheticId}-1`,
        type: 'brace',
        startNodeId: nodeBotMin.id,
        endNodeId: nodeTopMax.id,
        section: TIMBER_SECTION,
        material: { E: braceMat.E, G: braceMat.G },
        endReleases: PINNED,
      })
      memberDensity.set(m1Id, braceMat.density)

      const m2Id = `m${memberCount++}`
      members.push({
        id: m2Id,
        partId: `${syntheticId}-2`,
        type: 'brace',
        startNodeId: nodeTopMin.id,
        endNodeId: nodeBotMax.id,
        section: TIMBER_SECTION,
        material: { E: braceMat.E, G: braceMat.G },
        endReleases: PINNED,
      })
      memberDensity.set(m2Id, braceMat.density)
    }
  }

  // Step 2 - Panel brace members (fully moment-resisting at both ends, per CLAUDE.md)
  // Use snapped positions: panel endpoints are structurally at the post centroids even
  // though the visual mesh is inset. This ensures shared nodes and structural connectivity.
  // Skip panels whose endpoints don't both reach a post — infill segments (e.g. wall-frame
  // panels spanning within a bay rather than post-to-post) would create free-floating nodes
  // that destabilise the stiffness matrix.
  for (const pd of panelData) {
    if (!pd.spansPostToPost) continue
    const startNode = getOrCreate(pd.snappedStart)
    const endNode = getOrCreate(pd.snappedEnd)
    const panelMat = getMaterial(pd.creator.spec.materialId, 'F14')
    const memberId = `m${memberCount++}`
    members.push({
      id: memberId,
      partId: pd.creator.id ?? `panel-brace-${memberCount}`,
      type: 'panel-brace',
      startNodeId: startNode.id,
      endNodeId: endNode.id,
      section: panelSection(pd.heightM, pd.depthM),
      material: { E: panelMat.E, G: panelMat.G },
      endReleases: RIGID,
    })
    memberDensity.set(memberId, panelMat.density)
  }

  // Step 3 - Supports: idealised pin (DX DY DZ restrained, rotations free)
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
      // Fixed base: anchor bolts resist rotation about all axes.
      // RX/RY=true prevents phantom horizontal sway from consistent nodal load moments
      // at base nodes (panel self-weight MY/MX) exciting free rotation DOFs → near-zero
      // Cholesky pivot → multi-metre phantom deflections via Tikhonov regularisation.
      // RZ=true prevents near-singular torsion for posts with no lateral panel connections.
      RX: true,
      RY: true,
      RZ: true,
    }))

  // Step 4 - Load cases: G (dead), Q (live), Wu (wind X), Eu (seismic X)
  //
  // All load intensities are INDICATIVE preliminary values for design iteration.
  // A chartered structural engineer must confirm site-specific loads before construction.

  // 4a. Dead - self-weight UDL on all members
  const deadDistLoads: MemberDistLoad[] = members.map((m) => {
    const density = memberDensity.get(m.id) ?? 500
    const area = m.section.A
    const wSelf = -(density * GRAVITY * area) // N/m, downward (-Z)
    return { memberId: m.id, direction: 'Fz' as const, w1: wSelf, w2: wSelf }
  })

  // Total dead weight (N) - needed for seismic base shear
  const nodeById = new Map(Array.from(nodeMap.values()).map((n) => [n.id, n]))
  const W_dead = deadDistLoads.reduce((sum, dl, i) => {
    const m = members[i]
    if (!m) return sum
    const s = nodeById.get(m.startNodeId)
    const e = nodeById.get(m.endNodeId)
    if (!s || !e) return sum
    const len = Math.hypot(e.x - s.x, e.y - s.y, e.z - s.z)
    return sum + Math.abs(dl.w1) * len
  }, 0)

  // 4b. Live - imposed floor load on horizontal panel-brace members.
  // Q = 1.5 kPa (NZS 1170.1 Table 3.1, residential floor).
  // Tributary width = panel height (acting as deep floor beam) - engineer must confirm.
  const LIVE_kPa = 1.5

  const liveDistLoads: MemberDistLoad[] = []
  for (const m of members) {
    if (m.type !== 'panel-brace') continue
    const sn = nodeById.get(m.startNodeId)
    const en = nodeById.get(m.endNodeId)
    if (!sn || !en) continue
    if (Math.abs(en.z - sn.z) > TOL) continue // horizontal panels only
    const heightM = panelHeightByPartId.get(m.partId) ?? DEFAULT_PANEL_HEIGHT_GRIDS * GRID_UNIT_M
    const liveW = LIVE_kPa * 1e3 * heightM
    liveDistLoads.push({ memberId: m.id, direction: 'Fz', w1: -liveW, w2: -liveW })
  }

  // 4c. Lateral load helpers
  // Panel junction Z levels above base: where floor diaphragm action transfers lateral load.
  const panelJunctionZs = Array.from(
    new Set([
      ...panelData.map((pd) => pd.bottomZ),
      ...panelData.map((pd) => roundTo(pd.bottomZ + pd.heightM)),
    ]),
  )
    .filter((z) => Math.abs(z - baseZ) > TOL)
    .sort((a, b) => a - b)

  // Post nodes per junction level (nodes on a post centroid at that Z)
  type LevelEntry = { height: number; nodes: ModelNode[] }
  const panelLevels: LevelEntry[] = panelJunctionZs
    .map((z) => ({
      height: z - baseZ,
      nodes: Array.from(nodeMap.values()).filter(
        (n) =>
          Math.abs(n.z - z) < TOL &&
          postCentroids.some((pc) => Math.hypot(n.x - pc.x, n.y - pc.y) < TOL),
      ),
    }))
    .filter((lev) => lev.nodes.length > 0)

  // Triangular lateral force distribution: F_i = V_total * h_i / sum(h_j)
  const heightSum = panelLevels.reduce((s, lev) => s + lev.height, 0)

  function lateralNodeLoads(V_total: number, direction: 'FX' | 'FY'): NodeLoad[] {
    if (panelLevels.length === 0 || heightSum < 0.001 || V_total === 0) return []
    const loads: NodeLoad[] = []
    for (const lev of panelLevels) {
      const F_level = V_total * (lev.height / heightSum)
      const F_per_node = F_level / lev.nodes.length
      for (const n of lev.nodes) {
        loads.push(
          direction === 'FX' ? { nodeId: n.id, FX: F_per_node } : { nodeId: n.id, FY: F_per_node },
        )
      }
    }
    return loads
  }

  // 4d. Wind X - simplified NZS 1170.2
  // Vd = 30 m/s, Terrain Cat B -> peak velocity pressure approx 540 Pa.
  // Net wall pressure coeff approx 1.0; applied on building face in Y-Z plane (wind in +X).
  // Engineer must use site-specific design wind speed.
  const WIND_PRESSURE_Pa = 540
  const allNodeList = Array.from(nodeMap.values())
  const buildingH = Math.max(...allNodeList.map((n) => n.z)) - baseZ
  const nodeYs = allNodeList.map((n) => n.y)
  const buildingW = Math.max(...nodeYs) - Math.min(...nodeYs)
  const V_wind = WIND_PRESSURE_Pa * buildingH * (buildingW > 0.01 ? buildingW : 1)

  // 4e. Seismic X - simplified NZS 1170.5
  // Cd(T1) approx 0.4 (Zone 0.4, mu=1.25, Sp=0.7, k_mu=1 - near-period estimate).
  // Engineer must apply site-specific hazard factor Z and structural ductility mu.
  const SEISMIC_Cd = 0.4
  const V_seismic = SEISMIC_Cd * W_dead

  const loadCases: LoadCase[] = [
    {
      id: 'dead',
      name: 'G - Gravity (self-weight)',
      nodeLoads: [],
      memberDistLoads: deadDistLoads,
    },
    {
      id: 'live',
      name: 'Q - Live floor (1.5 kPa x 0.8 m tributary depth; indicative)',
      nodeLoads: [],
      memberDistLoads: liveDistLoads,
    },
    {
      id: 'wind_x',
      name: 'Wu - Wind +X (NZS 1170.2 simplified: 540 Pa on YxH face; indicative)',
      nodeLoads: lateralNodeLoads(V_wind, 'FX'),
      memberDistLoads: [],
    },
    {
      id: 'seismic_x',
      name: 'Eu - Seismic +X (NZS 1170.5 simplified: Cd=0.4; indicative)',
      nodeLoads: lateralNodeLoads(V_seismic, 'FX'),
      memberDistLoads: [],
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
