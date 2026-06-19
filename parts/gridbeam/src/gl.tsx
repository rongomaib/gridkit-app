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
} from 'three'
import type { GridBeamGlValue } from './types'

export function PartsGl(
  props: PartsGlProps<GridBeamGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="gridbeams">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<GridBeamGlValue>, 'parts'> & {
  part: GridBeamGlValue
  onPartClick?: (id: string) => void
}

export function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      gridLengthInMeters,
      lengthInGrids,
      lengthInMeters,
      holeDiameterInMeters,
      position,
      quaternion,
      scale,
      variant: { id: variantId, materials },
    },
    onPartClick,
  } = props

  const beamMaterial = materials.beam
  if (beamMaterial === undefined) {
    throw new Error(`gridbeam variant ${variantId} missing materials.beam`)
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`gridbeam-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'gridbeam' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <Beam
        id={id}
        gridLengthInMeters={gridLengthInMeters}
        lengthInGrids={lengthInGrids}
        lengthInMeters={lengthInMeters}
        material={beamMaterial}
      >
        <Holes
          sizeInGrids={lengthInGrids}
          gridLengthInMeters={gridLengthInMeters}
          holeDiameterInMeters={holeDiameterInMeters}
        />
      </Beam>
    </group>
  )
}

interface BeamProps {
  id: string
  gridLengthInMeters: number
  lengthInGrids: number
  lengthInMeters: number
  material: PartMaterial
  children: React.ReactNode | Array<React.ReactNode>
}

// TODO move to texture descriptor in part type
const TEXTURE_SIZE = 0.4

function Beam(props: BeamProps) {
  const { id, gridLengthInMeters, lengthInGrids, lengthInMeters, material, children } = props

  const uniqueNumericId = useMemo(() => {
    return [...id].reduce((sofar, _, i) => sofar + id.charCodeAt(i), 0)
  }, [id])

  const geometry = useMemo(() => {
    const boxSize = [lengthInMeters, gridLengthInMeters, gridLengthInMeters] as [
      number,
      number,
      number,
    ]
    const boxGeometry = new BoxGeometry(...boxSize)

    const beamScale = 0.995
    boxGeometry.scale(beamScale, beamScale, beamScale)

    // translate beam so first hole is at (0, 0, 0).
    boxGeometry.translate((gridLengthInMeters * (lengthInGrids - 1)) / 2, 0, 0)

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
  }, [gridLengthInMeters, lengthInGrids, lengthInMeters, uniqueNumericId])

  const texture = useTexture(material)

  return (
    <group name={`gridbeam-beam-${id}`}>
      <mesh name="gridbeam-beam-texture" geometry={geometry} castShadow receiveShadow>
        <meshLambertMaterial map={texture} />
      </mesh>
      {children}
    </group>
  )
}

const HOLE_SEGMENTS = 8

interface HolesProps {
  sizeInGrids: number
  gridLengthInMeters: number
  holeDiameterInMeters: number
}

function Holes(props: HolesProps) {
  const { sizeInGrids, gridLengthInMeters, holeDiameterInMeters } = props
  const holeRadius = holeDiameterInMeters / 2

  const material = useMemo(() => {
    return new MeshBasicMaterial({ color: 'black' })
  }, [])

  const geometry = useMemo(() => {
    return new CircleGeometry(holeRadius, HOLE_SEGMENTS)
  }, [holeRadius])

  const mesh = useMemo(() => {
    const m = new InstancedMesh(geometry, material, 4 * sizeInGrids)
    const dummy = new Object3D()

    for (let index = 0; index < sizeInGrids; index++) {
      const mIndex = 4 * index

      // top
      dummy.rotation.x = 0
      dummy.position.set(index * gridLengthInMeters, 0, 1e-4 + (1 / 2) * gridLengthInMeters)
      dummy.updateMatrix()
      m.setMatrixAt(mIndex, dummy.matrix)

      // bottom
      dummy.rotation.x = Math.PI
      dummy.position.set(index * gridLengthInMeters, 0, -1e-4 - (1 / 2) * gridLengthInMeters)
      dummy.updateMatrix()
      m.setMatrixAt(mIndex + 1, dummy.matrix)

      // left
      dummy.rotation.x = (3 / 2) * Math.PI
      dummy.position.set(index * gridLengthInMeters, 1e-4 + (1 / 2) * gridLengthInMeters, 0)
      dummy.updateMatrix()
      m.setMatrixAt(mIndex + 2, dummy.matrix)

      // top
      dummy.rotation.x = (1 / 2) * Math.PI
      dummy.position.set(index * gridLengthInMeters, -1e-4 - (1 / 2) * gridLengthInMeters, 0)
      dummy.updateMatrix()
      m.setMatrixAt(mIndex + 3, dummy.matrix)
    }

    return m
  }, [sizeInGrids, gridLengthInMeters, material, geometry])

  return <primitive name="gridbeam-holes" object={mesh} />
}
