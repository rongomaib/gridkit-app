import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { BoxGeometry, MeshLambertMaterial } from 'three'
import type { Beam120GlValue } from './types'

export function PartsGl(
  props: PartsGlProps<Beam120GlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="beam120s">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<Beam120GlValue>, 'parts'> & {
  part: Beam120GlValue
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
    geo.translate(lengthInMeters / 2, sectionWidthInMeters / 2, sectionDepthInMeters / 2)
    return geo
  }, [lengthInMeters, sectionWidthInMeters, sectionDepthInMeters])

  const mat = useMemo(() => {
    return new MeshLambertMaterial({ color: material.color })
  }, [material.color])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`beam120-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'beam120' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <mesh
        name={`beam120-mesh-${id}`}
        geometry={geometry}
        material={mat}
        castShadow
        receiveShadow
      />
    </group>
  )
}
