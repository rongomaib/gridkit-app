import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { type PartMaterial, useTexture } from '@villagekit/part/base'
import type React from 'react'
import { useMemo } from 'react'
import {
  BoxGeometry,
  type BufferAttribute,
  CircleGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three'
import { getEveryHolePosition } from './helpers'
import type { GridPanelGlValue, GridPanelHoles, GridPanelSpecHoleVariant } from './types'

export function PartsGl(props: PartsGlProps<GridPanelGlValue>) {
  const { parts, ...restProps } = props

  return (
    <group name="gridpanels">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<GridPanelGlValue>, 'parts'> & {
  part: GridPanelGlValue
}

export function PartGl(props: PartGlProps) {
  const { part } = props
  const {
    id,
    variant,
    sizeInGrids,
    holes,
    holeVariant,
    gridLengthInMeters,
    holeDiameterInMeters,
    thicknessInMeters,
    position,
    quaternion,
    scale,
  } = part
  const { id: variantId, materials } = variant

  const panelMaterial = materials.panel
  if (panelMaterial === undefined) {
    throw new Error(`gridpanel variant ${variantId} missing materials.panel`)
  }

  return (
    <group name={`gridpanel-container-${id}`}>
      <Panel
        id={id}
        sizeInGrids={sizeInGrids}
        gridLengthInMeters={gridLengthInMeters}
        thicknessInMeters={thicknessInMeters}
        material={panelMaterial}
        position={position}
        quaternion={quaternion}
        scale={scale}
      >
        {holes && (
          <Holes
            sizeInGrids={sizeInGrids}
            gridLengthInMeters={gridLengthInMeters}
            holeDiameterInMeters={holeDiameterInMeters}
            thicknessInMeters={thicknessInMeters}
            holes={holes}
            holeVariant={holeVariant}
          />
        )}
      </Panel>
    </group>
  )
}

interface PanelProps {
  id: string
  sizeInGrids: [number, number]
  gridLengthInMeters: number
  thicknessInMeters: number
  material: PartMaterial
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
  children: React.ReactNode | Array<React.ReactNode>
}

// TODO move to texture descriptor in part type
const TEXTURE_SIZE = 0.4

function Panel(props: PanelProps) {
  const {
    id,
    sizeInGrids,
    gridLengthInMeters,
    thicknessInMeters,
    material,
    position,
    quaternion,
    scale,
    children,
  } = props

  const uniqueNumericId = useMemo(() => {
    return [...id].reduce((sofar, _, i) => sofar + id.charCodeAt(i), 0)
  }, [id])

  const geometry = useMemo(() => {
    const boxSize: [number, number, number] = [
      sizeInGrids[0] * gridLengthInMeters,
      sizeInGrids[1] * gridLengthInMeters,
      thicknessInMeters,
    ]
    const boxGeometry = new BoxGeometry(...boxSize)

    const beamScale = 0.995
    boxGeometry.scale(beamScale, beamScale, beamScale)

    // translate beam so first hole is at (0, 0, 0).
    boxGeometry.translate(
      0.5 * (gridLengthInMeters * (sizeInGrids[0] - 1)),
      0.5 * (gridLengthInMeters * (sizeInGrids[1] - 1)),
      0,
    )

    // set uvs such that texture maps to world units

    const s1 = boxSize[0] / TEXTURE_SIZE
    const s2 = boxSize[1] / TEXTURE_SIZE
    const s3 = boxSize[2] / TEXTURE_SIZE

    const index = boxGeometry.getIndex()
    if (index == null) throw new Error('unexpected')
    const uvs = boxGeometry.getAttribute('uv') as BufferAttribute

    const uvOffsetX = Math.sin(uniqueNumericId) * 10
    const uvOffsetY = Math.cos(uniqueNumericId) * 10

    // px
    uvs.setXY(index.getX(0), uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(1), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(2), s3 + uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(3), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(4), s3 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(5), s3 + uvOffsetX, s2 + uvOffsetY)

    // nx
    uvs.setXY(index.getX(6), uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(7), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(8), s3 + uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(9), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(10), s3 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(11), s3 + uvOffsetX, s2 + uvOffsetY)

    // py
    uvs.setXY(index.getX(12), uvOffsetX, s3 + uvOffsetY)
    uvs.setXY(index.getX(13), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(14), s1 + uvOffsetX, s3 + uvOffsetY)
    uvs.setXY(index.getX(15), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(16), s1 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(17), s1 + uvOffsetX, s3 + uvOffsetY)

    // ny
    uvs.setXY(index.getX(18), uvOffsetX, s3 + uvOffsetY)
    uvs.setXY(index.getX(19), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(20), s1 + uvOffsetX, s3 + uvOffsetY)
    uvs.setXY(index.getX(21), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(22), s1 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(23), s1 + uvOffsetX, s3 + uvOffsetY)

    // pz
    uvs.setXY(index.getX(24), uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(25), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(26), s1 + uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(27), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(28), s1 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(29), s1 + uvOffsetX, s2 + uvOffsetY)

    // nz
    uvs.setXY(index.getX(30), uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(31), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(32), s1 + uvOffsetX, s2 + uvOffsetY)
    uvs.setXY(index.getX(33), uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(34), s1 + uvOffsetX, uvOffsetY)
    uvs.setXY(index.getX(35), s1 + uvOffsetX, s2 + uvOffsetY)

    return boxGeometry
  }, [sizeInGrids, gridLengthInMeters, thicknessInMeters, uniqueNumericId])

  const texture = useTexture(material)
  if (texture == null) return null

  return (
    <group name={`gridpanel-${id}`} position={position} quaternion={quaternion} scale={scale}>
      <mesh name="gridpanel-panel" geometry={geometry} castShadow receiveShadow>
        <meshLambertMaterial map={texture} />
      </mesh>
      {children}
    </group>
  )
}

const HOLE_SEGMENTS = 8
const IDENTITY_QUATERNION = new Quaternion()
const FLIP_Z_QUATERNION = new Quaternion().setFromUnitVectors(
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
)

interface HolesProps {
  sizeInGrids: [number, number]
  gridLengthInMeters: number
  holeDiameterInMeters: number
  thicknessInMeters: number
  holes: Exclude<GridPanelHoles, false>
  holeVariant: GridPanelSpecHoleVariant
}

function Holes(props: HolesProps) {
  const {
    sizeInGrids,
    gridLengthInMeters,
    holeDiameterInMeters,
    thicknessInMeters,
    holes,
    holeVariant,
  } = props
  const holeRadius = holeDiameterInMeters / 2

  const material = useMemo(() => {
    return new MeshBasicMaterial({ color: 'black' })
  }, [])

  const geometry = useMemo(() => {
    return new CircleGeometry(holeRadius, HOLE_SEGMENTS)
  }, [holeRadius])

  const mesh = useMemo(() => {
    const holePositions = holes === true ? getEveryHolePosition(sizeInGrids) : holes

    const numHoleMeshes =
      holeVariant === 'through' ? 2 * holePositions.length : holePositions.length
    const m = new InstancedMesh(geometry, material, numHoleMeshes)
    const dummy = new Object3D()

    for (
      let holePositionIndex = 0, mIndex = 0;
      holePositionIndex < holePositions.length;
      holePositionIndex++
    ) {
      const holePosition = holePositions[holePositionIndex]
      if (holePosition === undefined) throw new Error('unexpected: holePosition is undefined')
      const [mainIndex, crossIndex] = holePosition

      // up
      if (holeVariant === 'through') {
        dummy.setRotationFromQuaternion(IDENTITY_QUATERNION)
        dummy.position.set(
          mainIndex * gridLengthInMeters,
          crossIndex * gridLengthInMeters,
          1e-4 + 0.5 * thicknessInMeters,
        )
        dummy.updateMatrix()
        m.setMatrixAt(mIndex++, dummy.matrix)
      }

      // down
      dummy.setRotationFromQuaternion(FLIP_Z_QUATERNION)
      dummy.position.set(
        mainIndex * gridLengthInMeters,
        crossIndex * gridLengthInMeters,
        -1e-4 - 0.5 * thicknessInMeters,
      )
      dummy.updateMatrix()
      m.setMatrixAt(mIndex++, dummy.matrix)
    }

    return m
  }, [holes, holeVariant, sizeInGrids, thicknessInMeters, gridLengthInMeters, geometry, material])

  return <primitive name="gridpanel-holes" object={mesh} />
}
