import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { BoxGeometry, MeshLambertMaterial } from 'three'
import type { TimberGlValue } from './types'

export function PartsGl(
  props: PartsGlProps<TimberGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="timbers">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<TimberGlValue>, 'parts'> & {
  part: TimberGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      lengthInMeters,
      sectionWidthInMeters,
      sectionDepthInMeters,
      position,
      quaternion,
      scale,
      variant: { material },
    },
    onPartClick,
  } = props

  const geometry = useMemo(() => {
    const geo = new BoxGeometry(lengthInMeters, sectionWidthInMeters, sectionDepthInMeters)
    // translate so the start end is at local origin (matching gridbeam convention)
    geo.translate(lengthInMeters / 2, 0, 0)
    return geo
  }, [lengthInMeters, sectionWidthInMeters, sectionDepthInMeters])

  const mat = useMemo(() => {
    return new MeshLambertMaterial({ color: material.color })
  }, [material.color])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`timber-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'timber' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <mesh
        name={`timber-mesh-${id}`}
        geometry={geometry}
        material={mat}
        castShadow
        receiveShadow
      />
    </group>
  )
}
