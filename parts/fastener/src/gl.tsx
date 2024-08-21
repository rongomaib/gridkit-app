import { useGLTF } from '@react-three/drei'
import type { PartsGlProps } from '@villagekit/part'
import { useTexture } from '@villagekit/part/base'
import { map } from 'lodash-es'
import { memo, useMemo } from 'react'
import {
  type BufferGeometry,
  InstancedMesh,
  type Mesh,
  MeshPhongMaterial,
  Object3D,
  type Quaternion,
  type Vector3,
} from 'three'
import { mergeBufferGeometries } from 'three-stdlib'

import type { FastenerGlValue, FastenerVariant } from './types'

export function PartsGl(props: PartsGlProps<FastenerGlValue>) {
  const { parts } = props

  const fastenersByVariant: Record<string, FastenersProps> = useMemo(() => {
    const result: Record<string, FastenersProps> = {}
    for (const part of parts) {
      const { variant } = part
      const { id } = variant

      if (!(id in result)) {
        const { extrusionLengthInMeters, fastenedLengthInMeters } = part

        const fasteners: FastenersProps = {
          extrusionLengthInMeters,
          fastenedLengthInMeters,
          id,
          positions: [],
          quarternions: [],
          variant,
        }
        result[id] = fasteners
      }

      const { positions, quarternions } = result[id]!
      positions.push(part.position)
      quarternions.push(part.quaternion)
    }
    return result
  }, [parts])

  return (
    <group name="fasteners">
      {map(fastenersByVariant, (fastenersProps, id) => (
        <Fasteners key={id} {...fastenersProps} />
      ))}
    </group>
  )
}

interface FastenersProps {
  id: string
  extrusionLengthInMeters: number
  fastenedLengthInMeters: number
  positions: Array<Vector3>
  quarternions: Array<Quaternion>
  variant: FastenerVariant
}

export const Fasteners = memo(function Fasteners(props: FastenersProps) {
  const { id, extrusionLengthInMeters, fastenedLengthInMeters, positions, quarternions, variant } =
    props

  const { models } = variant
  const { scene } = useGLTF(models.fastener.modelUrl)

  const fastenerGeometry = useMemo(() => {
    const mesh = scene.children.find((obj) => (obj as Mesh).isMesh) as Mesh | null
    if (mesh == null) return null
    const geometry = mesh.geometry.clone()
    geometry.scale(0.01, 0.01, 0.01)
    geometry.rotateZ(Math.PI * 0.5)
    return geometry
  }, [scene])

  if (fastenerGeometry == null) return null

  return (
    <FastenersWithGeometry
      id={id}
      extrusionLengthInMeters={extrusionLengthInMeters}
      fastenedLengthInMeters={fastenedLengthInMeters}
      positions={positions}
      quarternions={quarternions}
      variant={variant}
      fastenerGeometry={fastenerGeometry}
    />
  )
})

interface FastenersWithGeometryProps extends FastenersProps {
  fastenerGeometry: BufferGeometry
}

function FastenersWithGeometry(props: FastenersWithGeometryProps) {
  const {
    id,
    extrusionLengthInMeters,
    fastenedLengthInMeters,
    positions,
    quarternions,
    variant,
    fastenerGeometry,
  } = props
  const { materials } = variant

  // TODO (mw): use mesh uvs instead of texture.repeat
  // https://discourse.threejs.org/t/use-the-same-texture-with-different-offsets-on-different-materials/19270/11
  const texture = useTexture(materials.fastener, { repeat: [0.2, 0.2] })

  const material = useMemo(() => {
    return new MeshPhongMaterial({ map: texture })
  }, [texture])
  material.needsUpdate = true

  const geometry = useMemo(() => {
    const sideA = fastenerGeometry.clone()
    const sideB = fastenerGeometry.clone()

    sideA.rotateZ(Math.PI)
    sideA.translate(fastenedLengthInMeters + 0.5 * extrusionLengthInMeters, 0, 0)
    sideB.translate(-0.5 * extrusionLengthInMeters, 0, 0)

    return mergeBufferGeometries([sideA, sideB])
  }, [fastenedLengthInMeters, extrusionLengthInMeters, fastenerGeometry])

  const mesh = useMemo(() => {
    if (geometry == null) return null
    const m = new InstancedMesh(geometry, material, positions.length)
    const dummy = new Object3D()

    positions.forEach((position, index) => {
      dummy.quaternion.fromArray(quarternions[index]!.toArray())
      dummy.position.copy(position)
      dummy.updateMatrix()
      m.setMatrixAt(index, dummy.matrix)
    })

    return m
  }, [geometry, material, positions, quarternions])

  if (mesh == null) return null

  return <primitive name={`fasteners-group-${id}`} castShadow receiveShadow object={mesh} />
}
