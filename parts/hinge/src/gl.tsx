import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
} from 'three'
import type { HingeGlValue } from './types'

// ─── Hinge dimensions (all metres) ─────────────────────────────────────────
const LEAF_WIDTH = 0.031          // each leaf: x extent
const LEAF_HEIGHT = 0.063         // total height (barrel length along Y)
const LEAF_THICKNESS = 0.004      // plate thickness in Z

const BARREL_OUTER_RADIUS = 0.0055
const KNUCKLE_LENGTH = 0.01545    // (0.063 − 3×0.0004) / 4
const KNUCKLE_GAP = 0.0004

// Mounting holes: 2 per leaf, 0.020m from centreline, 0.040m apart vertically
// 0.0115m from top/bottom edges → centres at y = 0.0115 and y = 0.0115 + 0.040
const HOLE_RADIUS = 0.0030        // visual circle radius (approx M6 bore / 2)
const HOLE_SEGMENTS = 16
const HOLE_X_FROM_CL = 0.020      // |x| offset from barrel centreline
const HOLE_Y_BOTTOM = 0.0115      // y of lower hole centre (from bottom of hinge)
const HOLE_Y_TOP = HOLE_Y_BOTTOM + 0.040  // 0.0515 m

// Barrel sits Z-forward of the plate face; in our coord system the plate
// occupies Z ∈ [0, LEAF_THICKNESS] and the barrel centre is at Z = LEAF_THICKNESS + BARREL_OUTER_RADIUS.
// But because the hinge is viewed from both sides we centre the plate on Z=0:
// plate Z ∈ [-LEAF_THICKNESS/2, +LEAF_THICKNESS/2], barrel centre at Z = +LEAF_THICKNESS/2 + BARREL_OUTER_RADIUS
const BARREL_Z = LEAF_THICKNESS / 2 + BARREL_OUTER_RADIUS

// Steel body colour
const BODY_COLOR = '#4a4a4a'

// ─── PartsGl ────────────────────────────────────────────────────────────────

export function PartsGl(props: PartsGlProps<HingeGlValue> & { onPartClick?: (id: string) => void }) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="hinges">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

// ─── PartGl ─────────────────────────────────────────────────────────────────

type PartGlProps = Omit<PartsGlProps<HingeGlValue>, 'parts'> & {
  part: HingeGlValue
  onPartClick?: (id: string) => void
}

export function PartGl(props: PartGlProps) {
  const {
    part: { id, angle, position, quaternion, scale },
    onPartClick,
  } = props

  // Leaf 2 rotation: 180° = flat open, 0° = fully closed (folded)
  const angleInRadians = (angle * Math.PI) / 180
  // Negative rotation folds the plate towards the barrel side (+Z)
  const leaf2RotationY = angleInRadians - Math.PI

  return (
    <group
      name={`hinge-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'hinge' }}
      onClick={(e) => { e.stopPropagation(); onPartClick?.(id) }}
    >
      {/* Fixed left leaf */}
      <LeafLeft id={id} />

      {/* Rotating right leaf */}
      <group name={`hinge-leaf2-${id}`} position={[0, 0, BARREL_Z]} rotation={[0, leaf2RotationY, 0]}>
        <group position={[0, 0, -BARREL_Z]}>
          <LeafRight id={id} />
        </group>
      </group>
    </group>
  )
}

// ─── Shared materials (module-level singletons) ──────────────────────────────

// We create these outside components so they are stable references.
// (Safe because they carry no per-instance state.)
const bodyMaterial = new MeshLambertMaterial({ color: BODY_COLOR })
const holeMaterial = new MeshBasicMaterial({ color: '#1a1a1a' })

// ─── Left leaf ───────────────────────────────────────────────────────────────

interface LeafLeftProps {
  id: string
}

function LeafLeft({ id }: LeafLeftProps) {
  // Plate: x ∈ [-LEAF_WIDTH, 0], y ∈ [0, LEAF_HEIGHT], z centred on 0
  const plateGeometry = useMemo(() => {
    const g = new BoxGeometry(LEAF_WIDTH, LEAF_HEIGHT, LEAF_THICKNESS)
    // Translate so the right edge (x=0) is at origin x, bottom (y=0) at origin y
    g.translate(-LEAF_WIDTH / 2, LEAF_HEIGHT / 2, 0)
    return g
  }, [])

  // Knuckles 1 (top, i=0) and 3 (i=2) belong to left leaf — both hollow (pin-hole)
  // Knuckle i starts at y = LEAF_HEIGHT − (i+1)*KNUCKLE_LENGTH − i*KNUCKLE_GAP
  const leftKnuckleGeometry = useMemo(() => knuckleGeometry(false), [])

  const knuckle1Y = knuckleYStart(0)
  const knuckle3Y = knuckleYStart(2)

  // Mounting hole circles: front and back faces of the plate
  const holeMesh = useMemo(() => buildMountingHoles('left'), [])

  return (
    <group name={`hinge-leaf-left-${id}`}>
      {/* Plate */}
      <mesh name="hinge-leaf-left-plate" geometry={plateGeometry} material={bodyMaterial} castShadow receiveShadow />

      {/* Knuckle 1 (top) */}
      <mesh
        name="hinge-leaf-left-knuckle1"
        geometry={leftKnuckleGeometry}
        material={bodyMaterial}
        position={[0, knuckle1Y + KNUCKLE_LENGTH / 2, BARREL_Z]}
        castShadow
        receiveShadow
      />

      {/* Knuckle 3 */}
      <mesh
        name="hinge-leaf-left-knuckle3"
        geometry={leftKnuckleGeometry}
        material={bodyMaterial}
        position={[0, knuckle3Y + KNUCKLE_LENGTH / 2, BARREL_Z]}
        castShadow
        receiveShadow
      />

      {/* Mounting hole circles */}
      <primitive name="hinge-leaf-left-holes" object={holeMesh} />
    </group>
  )
}

// ─── Right leaf ──────────────────────────────────────────────────────────────

interface LeafRightProps {
  id: string
}

function LeafRight({ id }: LeafRightProps) {
  // Plate: x ∈ [0, LEAF_WIDTH], y ∈ [0, LEAF_HEIGHT], z centred on 0
  const plateGeometry = useMemo(() => {
    const g = new BoxGeometry(LEAF_WIDTH, LEAF_HEIGHT, LEAF_THICKNESS)
    g.translate(LEAF_WIDTH / 2, LEAF_HEIGHT / 2, 0)
    return g
  }, [])

  // Knuckles 2 (i=1) and 4 (bottom, i=3) belong to right leaf — both solid pin
  const rightKnuckleGeometry = useMemo(() => knuckleGeometry(true), [])

  const knuckle2Y = knuckleYStart(1)
  const knuckle4Y = knuckleYStart(3)

  // Mounting hole circles
  const holeMesh = useMemo(() => buildMountingHoles('right'), [])

  return (
    <group name={`hinge-leaf-right-${id}`}>
      {/* Plate */}
      <mesh name="hinge-leaf-right-plate" geometry={plateGeometry} material={bodyMaterial} castShadow receiveShadow />

      {/* Knuckle 2 */}
      <mesh
        name="hinge-leaf-right-knuckle2"
        geometry={rightKnuckleGeometry}
        material={bodyMaterial}
        position={[0, knuckle2Y + KNUCKLE_LENGTH / 2, BARREL_Z]}
        castShadow
        receiveShadow
      />

      {/* Knuckle 4 (bottom) */}
      <mesh
        name="hinge-leaf-right-knuckle4"
        geometry={rightKnuckleGeometry}
        material={bodyMaterial}
        position={[0, knuckle4Y + KNUCKLE_LENGTH / 2, BARREL_Z]}
        castShadow
        receiveShadow
      />

      {/* Mounting hole circles */}
      <primitive name="hinge-leaf-right-holes" object={holeMesh} />
    </group>
  )
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Y coordinate of the bottom of knuckle index i (0 = topmost).
 * Knuckles are ordered top-to-bottom: i=0 is at the top of the hinge.
 */
function knuckleYStart(i: number): number {
  return LEAF_HEIGHT - (i + 1) * KNUCKLE_LENGTH - i * KNUCKLE_GAP
}

/**
 * Build a cylinder geometry for one knuckle segment.
 * isPin=true  → solid cylinder (right leaf, carries the pin)
 * isPin=false → hollow cylinder with pin-hole bore (left leaf)
 *
 * The cylinder's local Y axis runs along the knuckle length.
 * We position it via the mesh's `position` prop, centred on the knuckle midpoint.
 */
function knuckleGeometry(_isPin: boolean): CylinderGeometry {
  // Both leaf types use a solid CylinderGeometry for visual clarity.
  // Three.js CylinderGeometry has no inner-radius parameter; the hollow pin
  // bore is a sub-centimetre detail invisible at scene scale.
  // Left-leaf knuckles (isPin=false) would ideally show a bore of PIN_RADIUS,
  // but the solid appearance is indistinguishable at hinge scale.
  return new CylinderGeometry(
    BARREL_OUTER_RADIUS,
    BARREL_OUTER_RADIUS,
    KNUCKLE_LENGTH,
    20, // radialSegments
  )
}

/**
 * Build an InstancedMesh of 4 dark circles representing mounting holes
 * on both faces (front +Z and back -Z) of a leaf plate.
 *
 * Hole centres:
 *   side='left'  → x = -HOLE_X_FROM_CL
 *   side='right' → x = +HOLE_X_FROM_CL
 *   y = HOLE_Y_BOTTOM and HOLE_Y_TOP
 */
function buildMountingHoles(side: 'left' | 'right'): InstancedMesh {
  const holeX = side === 'left' ? -HOLE_X_FROM_CL : HOLE_X_FROM_CL
  const holeYPositions = [HOLE_Y_BOTTOM, HOLE_Y_TOP]

  // 2 holes × 2 faces = 4 instances
  const circleGeo = new CircleGeometry(HOLE_RADIUS, HOLE_SEGMENTS)
  const m = new InstancedMesh(circleGeo, holeMaterial, 4)
  const dummy = new Object3D()

  let mIndex = 0
  for (const holeY of holeYPositions) {
    // Front face (+Z)
    dummy.rotation.set(0, 0, 0)
    dummy.position.set(holeX, holeY, LEAF_THICKNESS / 2 + 1e-4)
    dummy.updateMatrix()
    m.setMatrixAt(mIndex++, dummy.matrix)

    // Back face (-Z): rotate 180° around X so the circle faces outward
    dummy.rotation.set(Math.PI, 0, 0)
    dummy.position.set(holeX, holeY, -(LEAF_THICKNESS / 2 + 1e-4))
    dummy.updateMatrix()
    m.setMatrixAt(mIndex++, dummy.matrix)
  }

  return m
}
