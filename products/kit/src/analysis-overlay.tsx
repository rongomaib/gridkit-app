// Phase 5+6 — 3D analysis results overlay.
// Modes: heat (stress tubes), joints (moment bulges), ground (foundation footprint).
// Deflected shape is a permanent underlay when analysis is active.
import { Html } from '@react-three/drei'
import type { LoadCaseResult, StructuralModel } from '@villagekit/analysis'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowHelper,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three'
import { useProductKitContext } from './context'

export type VisualizationMode = 'heat' | 'joints' | 'ground'

type OverlayProps = {
  activeModes: Set<VisualizationMode>
  deflectionScale: number
}

export function AnalysisOverlay({ activeModes, deflectionScale }: OverlayProps) {
  const { structuralModel, solverResult } = useProductKitContext()
  if (activeModes.size === 0 || structuralModel == null || solverResult == null || !solverResult.ok)
    return null
  const lcr = solverResult.loadCaseResults[0]
  if (lcr == null) return null

  return (
    <group>
      {activeModes.has('heat') && <HeatTubes model={structuralModel} lcr={lcr} />}
      <DeflectedShapeLines model={structuralModel} lcr={lcr} scale={deflectionScale} />
      <XBraceLines model={structuralModel} lcr={lcr} scale={deflectionScale} />
      {activeModes.has('joints') && <MomentBulges model={structuralModel} lcr={lcr} />}
      {activeModes.has('joints') && <ConnectivityDots model={structuralModel} />}
      {activeModes.has('joints') && <PanelQuads model={structuralModel} />}
      {activeModes.has('ground') && <FoundationFootprint model={structuralModel} lcr={lcr} />}
    </group>
  )
}

// --- Shared tooltip style ------------------------------------------------------

const TIP: React.CSSProperties = {
  pointerEvents: 'none',
  fontSize: '11px',
  lineHeight: '1.4',
  color: '#1a2a3a',
  background: 'rgba(255,255,255,0.92)',
  padding: '4px 8px',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
}

// --- Ember color ramp ----------------------------------------------------------
// cold dark blue → warm blue → amber → fire red → white-hot

const EMBER: Array<[number, number, number, number]> = [
  [0.0, 0x1e, 0x2a, 0x4a],
  [0.3, 0x4a, 0x7a, 0xb5],
  [0.6, 0xe8, 0x84, 0x0e],
  [0.85, 0xff, 0x33, 0x00],
  [1.0, 0xff, 0xff, 0xff],
]

function emberHex(t: number): string {
  const c = Math.max(0, Math.min(1, t))
  for (let i = 0; i < EMBER.length - 1; i++) {
    const [t0, r0, g0, b0] = EMBER[i] as [number, number, number, number]
    const [t1, r1, g1, b1] = EMBER[i + 1] as [number, number, number, number]
    if (c <= t1) {
      const s = (c - t0) / (t1 - t0)
      const r = Math.round(r0 + (r1 - r0) * s)
      const g = Math.round(g0 + (g1 - g0) * s)
      const b = Math.round(b0 + (b1 - b0) * s)
      return `rgb(${r},${g},${b})`
    }
  }
  return 'rgb(255,255,255)'
}

// --- Quaternion: align cylinder Y-axis with a given direction ------------------

function dirToQuaternionTuple(
  sx: number,
  sy: number,
  sz: number,
  ex: number,
  ey: number,
  ez: number,
): [number, number, number, number] {
  const dir = new Vector3(ex - sx, ey - sy, ez - sz).normalize()
  const up = new Vector3(0, 1, 0)
  const q = new Quaternion()
  const dot = up.dot(dir)
  if (dot > 0.9999) {
    q.identity()
  } else if (dot < -0.9999) {
    q.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI)
  } else {
    q.setFromUnitVectors(up, dir)
  }
  return [q.x, q.y, q.z, q.w]
}

// --- Shared prop type ----------------------------------------------------------

type LineProps = { model: StructuralModel; lcr: LoadCaseResult }

// --- Mode 1: Heat tubes --------------------------------------------------------

const TUBE_R = 0.06

type TubeItem = {
  id: string
  px: number
  py: number
  pz: number
  qx: number
  qy: number
  qz: number
  qw: number
  len: number
  color: string
  tip: string
}

function HeatTubes({ model, lcr }: LineProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number; z: number; text: string } | null>(
    null,
  )

  const tubes = useMemo<TubeItem[]>(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))
    const resultById = new Map(lcr.memberResults.map((r) => [r.memberId, r]))

    let maxTimber = 1
    let maxPanel = 1
    for (const m of model.members) {
      const res = resultById.get(m.id)
      if (!res) continue
      if (m.type === 'timber' || m.type === 'brace') {
        maxTimber = Math.max(maxTimber, Math.abs(res.forces.fx_start), Math.abs(res.forces.fx_end))
      } else {
        maxPanel = Math.max(maxPanel, Math.abs(res.forces.mz_start), Math.abs(res.forces.mz_end))
      }
    }

    const out: TubeItem[] = []
    for (const m of model.members) {
      const sn = nodeById.get(m.startNodeId)
      const en = nodeById.get(m.endNodeId)
      if (!sn || !en) continue
      const len = Math.hypot(en.x - sn.x, en.y - sn.y, en.z - sn.z)
      if (len < 0.001) continue

      const [qx, qy, qz, qw] = dirToQuaternionTuple(sn.x, sn.y, sn.z, en.x, en.y, en.z)
      const res = resultById.get(m.id)

      let demand = 0
      let tip = 'No force data'
      if (res) {
        if (m.type === 'timber' || m.type === 'brace') {
          const force = Math.max(Math.abs(res.forces.fx_start), Math.abs(res.forces.fx_end))
          demand = force / maxTimber
          const label = m.type === 'brace' ? 'Brace' : 'Post'
          tip = `${label}: ≈${Math.round(force / 9.81)} kg axial  (${Math.round(demand * 100)}% of peak)`
        } else {
          const moment = Math.max(Math.abs(res.forces.mz_start), Math.abs(res.forces.mz_end))
          demand = moment / maxPanel
          tip = `Panel: ≈${Math.round(moment / 9.81)} kg·m bending  (${Math.round(demand * 100)}% of peak)`
        }
      }

      out.push({
        id: m.id,
        px: (sn.x + en.x) / 2,
        py: (sn.y + en.y) / 2,
        pz: (sn.z + en.z) / 2,
        qx,
        qy,
        qz,
        qw,
        len,
        color: emberHex(demand),
        tip,
      })
    }
    return out
  }, [model, lcr])

  return (
    <>
      {tubes.map((t) => (
        <mesh
          key={t.id}
          position={[t.px, t.py, t.pz]}
          quaternion={[t.qx, t.qy, t.qz, t.qw]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered({ x: e.point.x, y: e.point.y, z: e.point.z, text: t.tip })
          }}
          onPointerOut={() => setHovered(null)}
        >
          <cylinderGeometry args={[TUBE_R, TUBE_R, t.len, 8, 1, true]} />
          <meshStandardMaterial
            color={t.color}
            roughness={0.5}
            metalness={0.1}
            depthTest={false}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}
      {hovered != null && (
        <Html position={[hovered.x, hovered.y, hovered.z]} center>
          <div style={TIP}>{hovered.text}</div>
        </Html>
      )}
    </>
  )
}

// --- Connectivity dots (joints mode) ------------------------------------------
// Rendered at each structural node. Color encodes connection status so the user
// can spot disconnected joints at a glance:
//   blue  = support (foundation pin)
//   green = connected (≥2 members meet here)
//   red   = free end (only 1 member — may be an eave tip or a topology bug)

type DotItem = {
  id: string
  x: number
  y: number
  z: number
  color: string
  radius: number
  tip: string
}

function ConnectivityDots({ model }: { model: StructuralModel }) {
  const [hovered, setHovered] = useState<{ x: number; y: number; z: number; text: string } | null>(
    null,
  )

  const dots = useMemo<DotItem[]>(() => {
    const deg = new Map<string, number>()
    for (const m of model.members) {
      deg.set(m.startNodeId, (deg.get(m.startNodeId) ?? 0) + 1)
      deg.set(m.endNodeId, (deg.get(m.endNodeId) ?? 0) + 1)
    }
    const supportIds = new Set(model.supports.map((s) => s.nodeId))
    return model.nodes.map((n) => {
      const degree = deg.get(n.id) ?? 0
      const isSupport = supportIds.has(n.id)
      const color = isSupport ? '#4488ff' : degree >= 2 ? '#00ff88' : '#ff4444'
      const radius = isSupport ? 0.035 : degree >= 2 ? 0.028 : 0.02
      const tip = isSupport
        ? `Support node — ${degree} member${degree !== 1 ? 's' : ''}`
        : degree >= 2
          ? `Connected — ${degree} members meet here`
          : `Free end — only ${degree} member attached`
      return { id: n.id, x: n.x, y: n.y, z: n.z, color, radius, tip }
    })
  }, [model])

  return (
    <>
      {dots.map((d) => (
        <mesh
          key={d.id}
          position={[d.x, d.y, d.z]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered({ x: e.point.x, y: e.point.y, z: e.point.z, text: d.tip })
          }}
          onPointerOut={() => setHovered(null)}
        >
          <sphereGeometry args={[d.radius, 8, 6]} />
          <meshBasicMaterial color={d.color} depthTest={false} />
        </mesh>
      ))}
      {hovered != null && (
        <Html position={[hovered.x, hovered.y, hovered.z]} center>
          <div style={TIP}>{hovered.text}</div>
        </Html>
      )}
    </>
  )
}

// --- Panel quads (joints mode) --------------------------------------------------
// Renders a translucent quad for each structural panel-brace member so you can
// see which shear wall planes are active in the stiffness matrix.

type QuadItem = {
  id: string
  px: number
  py: number
  pz: number
  qx: number
  qy: number
  qz: number
  qw: number
  spanLength: number
  h: number
}

function PanelQuads({ model }: { model: StructuralModel }) {
  const quads = useMemo<QuadItem[]>(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))
    const out: QuadItem[] = []
    for (const m of model.members) {
      if (m.type !== 'panel-brace') continue
      const sn = nodeById.get(m.startNodeId)
      const en = nodeById.get(m.endNodeId)
      if (!sn || !en) continue
      const dx = en.x - sn.x
      const dy = en.y - sn.y
      const spanLength = Math.hypot(dx, dy, en.z - sn.z)
      if (spanLength < 0.001) continue
      // Reverse panelSection(): Iz = h^3*d/12, A = h*d  →  h = sqrt(12*Iz/A)
      const h = Math.sqrt((12 * m.section.Iz) / m.section.A)
      // Rotation matrix: localX = member direction, localY = world +Z, localZ = normal
      // Set() args are ROW-major: set(n11,n12,n13,n14, n21,...) where nij = row i col j
      const wx = dx / spanLength
      const wy = dy / spanLength
      const m4 = new Matrix4().set(wx, 0, wy, 0, wy, 0, -wx, 0, 0, 1, 0, 0, 0, 0, 0, 1)
      const q = new Quaternion().setFromRotationMatrix(m4)
      out.push({
        id: m.id,
        px: (sn.x + en.x) / 2,
        py: (sn.y + en.y) / 2,
        pz: sn.z,
        qx: q.x,
        qy: q.y,
        qz: q.z,
        qw: q.w,
        spanLength,
        h,
      })
    }
    return out
  }, [model])

  return (
    <>
      {quads.map((q) => (
        <mesh key={q.id} position={[q.px, q.py, q.pz]} quaternion={[q.qx, q.qy, q.qz, q.qw]}>
          <planeGeometry args={[q.spanLength, q.h]} />
          <meshBasicMaterial
            color="#00c8b4"
            transparent
            opacity={0.18}
            side={DoubleSide}
            depthTest={false}
          />
        </mesh>
      ))}
    </>
  )
}

// --- Mode 2: Moment bulges -----------------------------------------------------

const MAX_BLOB_R = 0.04

type BlobItem = {
  id: string
  x: number
  y: number
  z: number
  r: number
  tip: string
}

function MomentBulges({ model, lcr }: LineProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number; z: number; text: string } | null>(
    null,
  )

  const blobs = useMemo<BlobItem[]>(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))
    const resultById = new Map(lcr.memberResults.map((r) => [r.memberId, r]))

    let maxMoment = 1
    for (const res of lcr.memberResults) {
      const m = Math.max(
        Math.abs(res.forces.my_start),
        Math.abs(res.forces.my_end),
        Math.abs(res.forces.mz_start),
        Math.abs(res.forces.mz_end),
      )
      if (m > maxMoment) maxMoment = m
    }

    const out: BlobItem[] = []

    for (const m of model.members) {
      const sn = nodeById.get(m.startNodeId)
      const en = nodeById.get(m.endNodeId)
      if (!sn || !en) continue
      const res = resultById.get(m.id)
      if (!res) continue

      const len = Math.hypot(en.x - sn.x, en.y - sn.y, en.z - sn.z)
      const dir = new Vector3(en.x - sn.x, en.y - sn.y, en.z - sn.z).normalize()

      // start-end blob
      const mStart = Math.max(Math.abs(res.forces.my_start), Math.abs(res.forces.mz_start))
      const rStart = (mStart / maxMoment) * MAX_BLOB_R
      if (rStart >= 0.002) {
        const pos = new Vector3(sn.x, sn.y, sn.z).addScaledVector(dir, 0.1 * len)
        out.push({
          id: `${m.id}-s`,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          r: rStart,
          tip: `Joint: ≈${Math.round(mStart / 9.81)} kg·m twisting force`,
        })
      }

      // member-end blob
      const mEnd = Math.max(Math.abs(res.forces.my_end), Math.abs(res.forces.mz_end))
      const rEnd = (mEnd / maxMoment) * MAX_BLOB_R
      if (rEnd >= 0.002) {
        const pos = new Vector3(en.x, en.y, en.z).addScaledVector(dir, -0.1 * len)
        out.push({
          id: `${m.id}-e`,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          r: rEnd,
          tip: `Joint: ≈${Math.round(mEnd / 9.81)} kg·m twisting force`,
        })
      }
    }
    return out
  }, [model, lcr])

  return (
    <>
      {blobs.map((b) => (
        <mesh
          key={b.id}
          position={[b.x, b.y, b.z]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered({ x: e.point.x, y: e.point.y, z: e.point.z, text: b.tip })
          }}
          onPointerOut={() => setHovered(null)}
        >
          <sphereGeometry args={[b.r, 8, 6]} />
          <meshStandardMaterial color="#ff6600" transparent opacity={0.65} roughness={0.8} />
        </mesh>
      ))}
      {hovered != null && (
        <Html position={[hovered.x, hovered.y, hovered.z]} center>
          <div style={TIP}>{hovered.text}</div>
        </Html>
      )}
    </>
  )
}

// --- Deflected shape (permanent underlay) -------------------------------------

type DeflectedProps = { model: StructuralModel; lcr: LoadCaseResult; scale: number }

function DeflectedShapeLines({ model, lcr, scale }: DeflectedProps) {
  const geometry = useMemo(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))
    const dispById = new Map(lcr.nodeDisplacements.map((d) => [d.nodeId, d]))
    const positions: number[] = []
    for (const m of model.members) {
      if (m.type === 'brace') continue
      const sn = nodeById.get(m.startNodeId)
      const en = nodeById.get(m.endNodeId)
      if (!sn || !en) continue
      const sd = dispById.get(m.startNodeId)
      const ed = dispById.get(m.endNodeId)
      // Clamp per-axis displacement before scaling to prevent runaway lines if solver
      // produces phantom deflections (e.g. from a near-singular stiffness matrix).
      // 5 mm actual × 100× scale = 0.5 m visual — enough to see real structural movement.
      const maxD = 0.005
      const cl = (v: number) => Math.max(-maxD, Math.min(maxD, v))
      positions.push(
        sn.x + cl(sd?.DX ?? 0) * scale,
        sn.y + cl(sd?.DY ?? 0) * scale,
        sn.z + cl(sd?.DZ ?? 0) * scale,
        en.x + cl(ed?.DX ?? 0) * scale,
        en.y + cl(ed?.DY ?? 0) * scale,
        en.z + cl(ed?.DZ ?? 0) * scale,
      )
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [model, lcr, scale])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={0xff8800} />
    </lineSegments>
  )
}

// --- X-brace deflected lines (permanent underlay, purple) ---------------------
// Renders diagonal brace members separately from orange beam lines so they are
// visually distinct. Applies the same deflection scale as DeflectedShapeLines.

function XBraceLines({ model, lcr, scale }: DeflectedProps) {
  const geometry = useMemo(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))
    const dispById = new Map(lcr.nodeDisplacements.map((d) => [d.nodeId, d]))
    const positions: number[] = []
    const maxD = 0.005
    const cl = (v: number) => Math.max(-maxD, Math.min(maxD, v))
    for (const m of model.members) {
      if (m.type !== 'brace') continue
      const sn = nodeById.get(m.startNodeId)
      const en = nodeById.get(m.endNodeId)
      if (!sn || !en) continue
      const sd = dispById.get(m.startNodeId)
      const ed = dispById.get(m.endNodeId)
      positions.push(
        sn.x + cl(sd?.DX ?? 0) * scale,
        sn.y + cl(sd?.DY ?? 0) * scale,
        sn.z + cl(sd?.DZ ?? 0) * scale,
        en.x + cl(ed?.DX ?? 0) * scale,
        en.y + cl(ed?.DY ?? 0) * scale,
        en.z + cl(ed?.DZ ?? 0) * scale,
      )
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [model, lcr, scale])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={0xcc00ff} />
    </lineSegments>
  )
}

// --- Mode 3: Foundation footprint ---------------------------------------------

type DiscItem = {
  nodeId: string
  x: number
  y: number
  z: number
  radius: number
  color: string
  tip: string
}

type HorizArrow = {
  key: string
  arrow: ArrowHelper
}

function FoundationFootprint({ model, lcr }: LineProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number; z: number; text: string } | null>(
    null,
  )

  const { discs, horizArrows } = useMemo(() => {
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]))

    let maxFZ = 1
    for (const r of lcr.reactions) {
      if (Math.abs(r.FZ) > maxFZ) maxFZ = Math.abs(r.FZ)
    }

    const discs: DiscItem[] = []
    const horizArrows: HorizArrow[] = []

    for (const r of lcr.reactions) {
      const node = nodeById.get(r.nodeId)
      if (!node) continue

      const radius = Math.max(0.018, Math.sqrt(Math.abs(r.FZ) / maxFZ) * 0.12)
      const isUplift = r.FZ < -1
      const color = isUplift ? '#f0d060' : '#c46040'

      const horiz = Math.sqrt(r.FX ** 2 + r.FY ** 2)
      let tip: string
      if (isUplift) {
        tip = `WARNING: post pulls UP — ${Math.round(Math.abs(r.FZ) / 9.81)} kg on anchor bolt`
      } else {
        tip = `Post pushes down ≈${Math.round(r.FZ / 9.81)} kg`
        if (horiz > maxFZ * 0.05) tip += `  |  sideways ≈${Math.round(horiz / 9.81)} kg`
      }

      discs.push({ nodeId: r.nodeId, x: node.x, y: node.y, z: node.z, radius, color, tip })

      // Show horizontal shear as a downward-pointing arrow from slightly above the base node.
      // In the Z-up isometric view, pointing in -Z (down) is clear and unambiguous.
      // The arrow length encodes the shear magnitude relative to max vertical reaction.
      if (horiz > maxFZ * 0.05) {
        const arrowOrigin = new Vector3(node.x, node.y, node.z + 0.12)
        const len = Math.min((horiz / maxFZ) * 0.35, 0.1)
        // Direction = downward (-Z) to read as "base is being pushed sideways here"
        const dir = new Vector3(0, 0, -1)
        const arrow = new ArrowHelper(dir, arrowOrigin, len, 0x2266cc, len * 0.35, len * 0.25)
        horizArrows.push({ key: `${r.nodeId}-h`, arrow })
      }
    }

    return { discs, horizArrows }
  }, [model, lcr])

  useEffect(
    () => () => {
      for (const { arrow } of horizArrows) arrow.dispose?.()
    },
    [horizArrows],
  )

  return (
    <>
      {discs.map((d) => (
        // rotation PI/2 around X lays the disc flat in the XY (horizontal) plane
        <mesh
          key={d.nodeId}
          position={[d.x, d.y, d.z - 0.005]}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered({ x: e.point.x, y: e.point.y, z: e.point.z, text: d.tip })
          }}
          onPointerOut={() => setHovered(null)}
        >
          <cylinderGeometry args={[d.radius, d.radius, 0.01, 16]} />
          <meshStandardMaterial color={d.color} roughness={0.7} />
        </mesh>
      ))}
      {horizArrows.map(({ key, arrow }) => (
        <primitive key={key} object={arrow} />
      ))}
      {hovered != null && (
        <Html position={[hovered.x, hovered.y, hovered.z + 0.1]} center>
          <div style={TIP}>{hovered.text}</div>
        </Html>
      )}
    </>
  )
}
