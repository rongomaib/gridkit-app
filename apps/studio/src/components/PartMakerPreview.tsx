import type { PartMakerSpec } from '@/lib/partMakerTypes'
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Suspense, useEffect, useMemo } from 'react'
import {
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  GridHelper,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Shape,
} from 'three'

interface PartMakerPreviewProps {
  spec: PartMakerSpec
  onFeatureClick?: (file: string) => void
}

// Build a rounded rectangle Shape in YZ plane, centred at origin
function buildRoundedRect(w: number, h: number, r: number): Shape {
  const rr = Math.min(r, Math.min(w, h) / 2)
  const shape = new Shape()
  const hw = w / 2
  const hh = h / 2

  if (rr <= 0) {
    shape.moveTo(-hw, -hh)
    shape.lineTo(hw, -hh)
    shape.lineTo(hw, hh)
    shape.lineTo(-hw, hh)
    shape.closePath()
    return shape
  }

  shape.moveTo(-hw + rr, -hh)
  shape.lineTo(hw - rr, -hh)
  shape.absarc(hw - rr, -hh + rr, rr, -Math.PI / 2, 0, false)
  shape.lineTo(hw, hh - rr)
  shape.absarc(hw - rr, hh - rr, rr, 0, Math.PI / 2, false)
  shape.lineTo(-hw + rr, hh)
  shape.absarc(-hw + rr, hh - rr, rr, Math.PI / 2, Math.PI, false)
  shape.lineTo(-hw, -hh + rr)
  shape.absarc(-hw + rr, -hh + rr, rr, Math.PI, (3 * Math.PI) / 2, false)
  shape.closePath()
  return shape
}

function buildGussetRight(leg1: number, leg2: number, r: number): Shape {
  const maxR = Math.min(leg1, leg2) / 4
  const rr = Math.min(r, maxR)
  const shape = new Shape()

  if (rr <= 0) {
    shape.moveTo(0, 0)
    shape.lineTo(leg1, 0)
    shape.lineTo(0, leg2)
    shape.closePath()
    return shape
  }

  // Right-angle vertex (origin) — inner arc
  shape.moveTo(rr, 0)
  shape.lineTo(leg1 - rr * 1.2, 0)
  // Hypotenuse end near X-axis
  shape.absarc(leg1 - rr * 1.5, rr * 0.5, rr, -Math.PI / 6, Math.PI / 3, false)
  // Apex near Y-axis
  shape.absarc(rr * 0.5, leg2 - rr * 1.5, rr, -Math.PI / 3 + Math.PI, (Math.PI * 5) / 6, false)
  shape.lineTo(0, rr)
  shape.absarc(rr, rr, rr, Math.PI, (3 * Math.PI) / 2, false)
  shape.closePath()
  return shape
}

function buildGussetIsosceles(base: number, height: number, r: number): Shape {
  const maxR = Math.min(base / 2, height) / 4
  const rr = Math.min(r, maxR)
  const hb = base / 2
  const shape = new Shape()

  if (rr <= 0) {
    shape.moveTo(-hb, 0)
    shape.lineTo(hb, 0)
    shape.lineTo(0, height)
    shape.closePath()
    return shape
  }

  shape.moveTo(-hb + rr, 0)
  shape.lineTo(hb - rr, 0)
  shape.absarc(hb - rr * 1.5, rr * 0.5, rr, -Math.PI / 6, Math.PI / 3, false)
  shape.absarc(rr * 0.5, height - rr, rr, -Math.PI / 4, Math.PI, false)
  shape.lineTo(-hb + rr * 1.5, rr * 0.5)
  shape.absarc(-hb + rr, rr, rr, Math.PI / 2 + Math.PI / 6, Math.PI, false)
  shape.closePath()
  return shape
}

function buildLSection(
  flangeW: number,
  flangeH: number,
  webT: number,
  r: number,
): Shape {
  // L cross-section: vertical web (webT × flangeH) + horizontal flange (flangeW × webT)
  // Origin at bottom-left corner
  const rr = Math.min(r, webT / 2)
  const shape = new Shape()

  if (rr <= 0) {
    shape.moveTo(0, 0)
    shape.lineTo(flangeW, 0)
    shape.lineTo(flangeW, webT)
    shape.lineTo(webT, webT)
    shape.lineTo(webT, flangeH)
    shape.lineTo(0, flangeH)
    shape.closePath()
    return shape
  }

  shape.moveTo(rr, 0)
  shape.lineTo(flangeW - rr, 0)
  shape.absarc(flangeW - rr, rr, rr, -Math.PI / 2, 0, false)
  shape.lineTo(flangeW, webT - rr)
  shape.absarc(flangeW - rr, webT - rr, rr, 0, Math.PI / 2, false)
  // re-entrant corner — no rounding
  shape.lineTo(webT, webT)
  shape.lineTo(webT, flangeH - rr)
  shape.absarc(webT - rr, flangeH - rr, rr, 0, Math.PI / 2, false)
  shape.lineTo(rr, flangeH)
  shape.absarc(rr, flangeH - rr, rr, Math.PI / 2, Math.PI, false)
  shape.lineTo(0, rr)
  shape.absarc(rr, rr, rr, Math.PI, (3 * Math.PI) / 2, false)
  shape.closePath()
  return shape
}

// Dispatcher — routes custom shapes to the group renderer, everything else to the prismatic renderer
function PartGeometry({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  if (spec.partShape === 'custom') {
    return <CustomGroupGeometry spec={spec} onFeatureClick={onFeatureClick} />
  }
  return <PrismaticGeometry spec={spec} onFeatureClick={onFeatureClick} />
}

// Renders arbitrary 3-D objects described by customShapeCode.
// The code body receives the full THREE namespace and all spec dimension fields,
// and must return a THREE.Group.
function CustomGroupGeometry({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  const group = useMemo(() => {
    if (!spec.customShapeCode.trim()) return null
    try {
      const fn = new Function(
        'THREE', 'mm',
        'widthMm', 'heightMm', 'thicknessMm', 'cornerRadius',
        'gussetLeg1Mm', 'gussetLeg2Mm',
        'lSectionFlangeWidthMm', 'lSectionFlangeHeightMm', 'lSectionWebThicknessMm',
        spec.customShapeCode,
      )
      return fn(
        THREE, 1 / 1000,
        spec.widthMm, spec.heightMm, spec.thicknessMm, spec.cornerRadius,
        spec.gussetLeg1Mm, spec.gussetLeg2Mm,
        spec.lSectionFlangeWidthMm, spec.lSectionFlangeHeightMm, spec.lSectionWebThicknessMm,
      ) as THREE.Group
    } catch (err) {
      console.error('[PartMaker] customShapeCode error:', err)
      return null
    }
  }, [spec])

  if (!group) return null

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object
    <primitive
      object={group}
      onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); onFeatureClick?.('src/gl.tsx') }}
    />
  )
}

function PrismaticGeometry({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  const { geometry, material, holeMeshes } = useMemo(() => {
    const mm = 1 / 1000
    const r = spec.cornerRadius * mm
    const lengthM = (spec.previewLengthGrids * spec.gridUnitMm) * mm
    const thicknessM = spec.thicknessMm * mm

    let shape: Shape
    let extrudeDepth: number
    let isFlat = false

    switch (spec.partShape) {
      case 'plate':
        shape = buildRoundedRect(spec.widthMm * mm, spec.thicknessMm * mm, r)
        extrudeDepth = lengthM
        break
      case 'gusset-right':
        shape = buildGussetRight(spec.gussetLeg1Mm * mm, spec.gussetLeg2Mm * mm, r)
        extrudeDepth = thicknessM
        isFlat = true
        break
      case 'gusset-isosceles':
        shape = buildGussetIsosceles(spec.gussetLeg1Mm * mm, spec.gussetLeg2Mm * mm, r)
        extrudeDepth = thicknessM
        isFlat = true
        break
      case 'L-section':
        shape = buildLSection(
          spec.lSectionFlangeWidthMm * mm,
          spec.lSectionFlangeHeightMm * mm,
          spec.lSectionWebThicknessMm * mm,
          r,
        )
        extrudeDepth = lengthM
        break
      case 'box':
      default:
        shape = buildRoundedRect(spec.widthMm * mm, spec.heightMm * mm, r)
        extrudeDepth = lengthM
        break
    }

    const geo = new ExtrudeGeometry(shape, { depth: extrudeDepth, bevelEnabled: false })
    // Z-up convention: rotateX(+π/2) then rotateZ(+π/2) maps
    // shape-X→worldY (width), shape-Y→worldZ (height, upward), extrusion-Z→worldX (length)
    geo.rotateX(Math.PI / 2)
    geo.rotateZ(Math.PI / 2)

    const mat = new MeshLambertMaterial({ color: new Color(spec.color) })

    // Holes
    // After rotateX(-π/2) + rotateZ(-π/2): shape-X→worldY, shape-Y→world-Z, extrusion→worldX
    // box   : width in Y, height in Z → holes go through Y (default CylinderGeometry axis), rows offset in Z
    // plate : width in Y, thickness in Z → holes go through Z (thin face), rows offset in Y
    // L-sect: flange height in Y, web thickness in Z → holes go through Z, rows offset in Y
    // gusset: face in YZ plane, thickness in X → startX > endX so no holes rendered
    const holeGeos: { geo: CylinderGeometry; x: number; y: number; z: number }[] = []
    if (spec.holeDiameter > 0) {
      const holeR = (spec.holeDiameter / 2) * mm
      const startX = spec.holeEdgeOffsetMm * mm
      const endX = lengthM - spec.holeEdgeOffsetMm * mm
      const spacing = spec.holeSpacingMm * mm

      let holeLengthM: number
      let rotateToZ: boolean  // if true, rotate cylinder from Y-axis to Z-axis
      let rowOffsets: number[]
      let useYRow: boolean  // if true, row offset in Y; if false, row offset in Z

      if (isFlat) {
        // gusset: extrusion=thicknessM along X, so startX>endX → no holes in practice
        holeLengthM = thicknessM
        rotateToZ = false
        rowOffsets = [0]
        useYRow = false
      } else if (spec.partShape === 'plate') {
        // plate: thin in Z (thicknessMm), wide in Y (widthMm)
        holeLengthM = thicknessM
        rotateToZ = true
        const halfW = (spec.widthMm * mm) / 2
        rowOffsets = spec.holeRows === 2 ? [-halfW / 2, halfW / 2] : [0]
        useYRow = true
      } else if (spec.partShape === 'L-section') {
        holeLengthM = spec.lSectionWebThicknessMm * mm
        rotateToZ = true
        const halfH = (spec.lSectionFlangeHeightMm * mm) / 2
        rowOffsets = spec.holeRows === 2 ? [-halfH / 2, halfH / 2] : [0]
        useYRow = true
      } else {
        // box: holes through width (Y direction)
        holeLengthM = spec.widthMm * mm
        rotateToZ = false
        const halfH = (spec.heightMm * mm) / 2
        rowOffsets = spec.holeRows === 2 ? [-halfH / 2, halfH / 2] : [0]
        useYRow = false
      }

      for (let x = startX; x <= endX + 0.0001; x += spacing) {
        for (const offset of rowOffsets) {
          const hGeo = new CylinderGeometry(holeR, holeR, holeLengthM * 1.1, 16)
          if (rotateToZ) hGeo.rotateX(Math.PI / 2)
          holeGeos.push({ geo: hGeo, x, y: useYRow ? offset : 0, z: useYRow ? 0 : offset })
        }
      }
    }

    return { geometry: geo, material: mat, holeMeshes: holeGeos }
  }, [spec])

  const holeMat = useMemo(
    () => new MeshBasicMaterial({ color: '#222222', transparent: true, opacity: 0.88 }),
    [],
  )

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object */}
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onFeatureClick?.('src/variants.ts') }}
      />
      {holeMeshes.map((h, i) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable index within memo
          key={i}
          geometry={h.geo}
          material={holeMat}
          position={[h.x, h.y, h.z]}
          onClick={(e) => { e.stopPropagation(); onFeatureClick?.('src/gl.tsx') }}
        />
      ))}
    </>
  )
}

function SceneGrid() {
  const grid = useMemo(() => {
    const g = new GridHelper(2, 20, '#888888', '#444444')
    g.rotateX(Math.PI / 2)  // default XZ → XY plane (Z-up ground)
    return g
  }, [])
  return <primitive object={grid} />
}

// Sets camera up to Z so the viewer uses engineering Z-up convention
function CameraUp() {
  const { camera } = useThree()
  useEffect(() => {
    camera.up.set(0, 0, 1)
  }, [camera])
  return null
}

function Scene({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  return (
    <>
      <CameraUp />
      <OrbitControls enableDamping />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 10]} intensity={0.8} castShadow />
      <PartGeometry spec={spec} onFeatureClick={onFeatureClick} />
      <SceneGrid />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={['#e74c3c', '#2ecc71', '#3498db']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  )
}

export function PartMakerPreview({ spec, onFeatureClick }: PartMakerPreviewProps) {
  const shapeLabel: Record<string, string> = {
    box: 'Box section',
    plate: 'Flat plate',
    'gusset-right': 'Right-angle gusset',
    'gusset-isosceles': 'Isosceles gusset',
    'L-section': 'L-section',
    custom: 'Custom profile',
  }

  const dimLine = (() => {
    const mm = (v: number) => `${v}mm`
    switch (spec.partShape) {
      case 'plate':
        return `${mm(spec.widthMm)} × ${mm(spec.thicknessMm)} × ${mm(spec.previewLengthGrids * spec.gridUnitMm)}`
      case 'gusset-right':
      case 'gusset-isosceles':
        return `${mm(spec.gussetLeg1Mm)} × ${mm(spec.gussetLeg2Mm)}, t=${mm(spec.thicknessMm)}`
      case 'L-section':
        return `${mm(spec.lSectionFlangeWidthMm)} × ${mm(spec.lSectionFlangeHeightMm)}, t=${mm(spec.lSectionWebThicknessMm)}`
      default:
        return `${mm(spec.widthMm)} × ${mm(spec.heightMm)} × ${mm(spec.previewLengthGrids * spec.gridUnitMm)}`
    }
  })()

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [1.5, -1.5, 1.0], fov: 45 }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene spec={spec} onFeatureClick={onFeatureClick} />
        </Suspense>
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: 'rgba(0,0,0,0.55)',
          color: 'white',
          fontSize: 11,
          padding: '5px 9px',
          borderRadius: 5,
          pointerEvents: 'none',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600 }}>{spec.displayName}</div>
        <div style={{ opacity: 0.8 }}>{shapeLabel[spec.partShape] ?? spec.partShape}</div>
        <div style={{ opacity: 0.7, fontFamily: 'monospace' }}>{dimLine}</div>
        {spec.holeDiameter > 0 && (
          <div style={{ opacity: 0.7 }}>⌀{spec.holeDiameter}mm holes @ {spec.holeSpacingMm}mm</div>
        )}
        {onFeatureClick && (
          <div style={{ opacity: 0.5, marginTop: 4, fontSize: 10 }}>click part to inspect code</div>
        )}
      </div>
    </div>
  )
}
