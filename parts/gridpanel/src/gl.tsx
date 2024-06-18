import '@react-three/fiber'
import {
  type AxisId,
  type AxisValues,
  axisIdToDirection,
  axisValuesToVector,
} from '@villagekit/math'
import { type PartMaterial, type PartsGlProps, useTexture } from '@villagekit/part/base'
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
import type { GridPanelGlValue } from './types'

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
  const {
    part: {
      id,
      gridLengthInMeters,
      holeDiameterInMeters,
      thicknessInMeters,
      mainAxis,
      mainLength,
      crossAxis,
      crossLength,
      thicknessAxis,
      locationInMeters,
      sizeInMeters,
      holes = true,
      variant: { id: variantId, materials },
    },
  } = props

  const panelMaterial = materials.panel
  if (panelMaterial === undefined) {
    throw new Error(`gridpanel variant ${variantId} missing materials.panel`)
  }

  return (
    <group
      name={`gridpanel-container-${id}`}
      position={locationInMeters as [number, number, number]}
    >
      <Panel id={id} sizeInMeters={sizeInMeters} material={panelMaterial}>
        {holes && (
          <Holes
            mainAxis={mainAxis}
            mainLength={mainLength}
            crossAxis={crossAxis}
            crossLength={crossLength}
            thicknessAxis={thicknessAxis}
            gridLengthInMeters={gridLengthInMeters}
            holeDiameterInMeters={holeDiameterInMeters}
            thicknessInMeters={thicknessInMeters}
            holes={holes}
          />
        )}
      </Panel>
    </group>
  )
}

interface PanelProps {
  id: string
  sizeInMeters: [number, number, number]
  material: PartMaterial
  children: React.ReactNode | Array<React.ReactNode>
}

// TODO move to texture descriptor in part type
const TEXTURE_SIZE = 0.4

function Panel(props: PanelProps) {
  const { id, sizeInMeters, material, children } = props

  const uniqueNumericId = useMemo(() => {
    return [...id].reduce((sofar, _, i) => sofar + id.charCodeAt(i), 0)
  }, [id])

  const geometry = useMemo(() => {
    const geometry = new BoxGeometry(sizeInMeters[0], sizeInMeters[1], sizeInMeters[2])

    const panelScale = 0.995
    geometry.scale(panelScale, panelScale, panelScale)

    // translate geometry so position starts at (0, 0, 0)
    geometry.translate(sizeInMeters[0] / 2, sizeInMeters[1] / 2, sizeInMeters[2] / 2)

    // set uvs such that texture maps to world units

    const s1 = sizeInMeters[0] / TEXTURE_SIZE
    const s2 = sizeInMeters[1] / TEXTURE_SIZE
    const s3 = sizeInMeters[2] / TEXTURE_SIZE

    const index = geometry.getIndex()
    if (index == null) throw new Error('unexpected')
    const uvs = geometry.getAttribute('uv') as BufferAttribute

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

    return geometry
  }, [sizeInMeters, uniqueNumericId])

  const texture = useTexture(material)
  if (texture == null) return null

  return (
    <group name={`gridpanel-${id}`}>
      <group name="gridpanel-panel">
        <mesh name="gridpanel-panel-texture" geometry={geometry} castShadow receiveShadow>
          <meshLambertMaterial map={texture} />
        </mesh>
      </group>
      {children}
    </group>
  )
}

const HOLE_SEGMENTS = 8

interface HolesProps {
  mainAxis: AxisId
  mainLength: number
  crossAxis: AxisId
  crossLength: number
  thicknessAxis: AxisId
  gridLengthInMeters: number
  holeDiameterInMeters: number
  thicknessInMeters: number
  holes: true | Array<[number, number]>
}

function Holes(props: HolesProps) {
  const {
    mainAxis,
    mainLength,
    crossAxis,
    crossLength,
    thicknessAxis,
    gridLengthInMeters,
    holeDiameterInMeters,
    thicknessInMeters,
    holes,
  } = props
  const holeRadius = holeDiameterInMeters / 2

  const material = useMemo(() => {
    return new MeshBasicMaterial({ color: 'black' })
  }, [])

  const geometry = useMemo(() => {
    return new CircleGeometry(holeRadius, HOLE_SEGMENTS)
  }, [holeRadius])

  const upQuaternion = useMemo(() => {
    const upDirection = axisIdToDirection(thicknessAxis)
    const upVector = new Vector3(...upDirection)
    const Z_AXIS = new Vector3(0, 0, 1)
    return new Quaternion().setFromUnitVectors(Z_AXIS, upVector)
  }, [thicknessAxis])

  const downQuaternion = useMemo(() => {
    const upDirection = axisIdToDirection(thicknessAxis)
    const upVector = new Vector3(...upDirection)
    const NEGATIVE_Z_AXIS = new Vector3(0, 0, -1)
    return new Quaternion().setFromUnitVectors(NEGATIVE_Z_AXIS, upVector)
  }, [thicknessAxis])

  const mesh = useMemo(() => {
    const holePositions = holes === true ? getEveryHolePosition([mainLength, crossLength]) : holes

    const m = new InstancedMesh(geometry, material, 2 * holePositions.length)
    const dummy = new Object3D()

    for (let holePositionIndex = 0; holePositionIndex < holePositions.length; holePositionIndex++) {
      const holePosition = holePositions[holePositionIndex]
      if (holePosition === undefined) throw new Error('unexpected: holePosition is undefined')
      const [mainIndex, crossIndex] = holePosition
      const mIndex = 2 * holePositionIndex

      // up
      dummy.setRotationFromQuaternion(upQuaternion)
      dummy.position.set(
        ...axisValuesToVector({
          [crossAxis]: (1 / 2 + crossIndex) * gridLengthInMeters,
          [mainAxis]: (1 / 2 + mainIndex) * gridLengthInMeters,
          [thicknessAxis]: 1e-4 + thicknessInMeters,
        } as AxisValues),
      )
      dummy.updateMatrix()
      m.setMatrixAt(mIndex, dummy.matrix)

      // down
      dummy.setRotationFromQuaternion(downQuaternion)
      dummy.position.set(
        ...axisValuesToVector({
          [crossAxis]: (1 / 2 + crossIndex) * gridLengthInMeters,
          [mainAxis]: (1 / 2 + mainIndex) * gridLengthInMeters,
          [thicknessAxis]: -1e-4,
        } as AxisValues),
      )
      dummy.updateMatrix()
      m.setMatrixAt(mIndex + 1, dummy.matrix)
    }

    return m
  }, [
    mainAxis,
    mainLength,
    crossAxis,
    crossLength,
    thicknessAxis,
    thicknessInMeters,
    gridLengthInMeters,
    geometry,
    material,
    upQuaternion,
    downQuaternion,
    holes,
  ])

  return <primitive name="gridpanel-holes" object={mesh} />
}
