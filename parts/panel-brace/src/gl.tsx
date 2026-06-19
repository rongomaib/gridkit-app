import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { BoxGeometry, MeshLambertMaterial } from 'three'
import type { PanelBraceGlValue } from './types'

export function PartsGl(
  props: PartsGlProps<PanelBraceGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="panel-braces">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<PanelBraceGlValue>, 'parts'> & {
  part: PanelBraceGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      lengthInMeters,
      depthInMeters,
      heightInMeters,
      position,
      quaternion,
      scale,
      variant: { material },
    },
    onPartClick,
  } = props

  const geometry = useMemo(() => {
    const geo = new BoxGeometry(lengthInMeters, depthInMeters, heightInMeters)
    // translate so start end is at local origin, height rises in +Z
    geo.translate(lengthInMeters / 2, 0, heightInMeters / 2)
    return geo
  }, [lengthInMeters, depthInMeters, heightInMeters])

  const mat = useMemo(() => {
    return new MeshLambertMaterial({ color: material.color })
  }, [material.color])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`panel-brace-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'panel-brace' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <mesh
        name={`panel-brace-mesh-${id}`}
        geometry={geometry}
        material={mat}
        castShadow
        receiveShadow
      />
    </group>
  )
}
