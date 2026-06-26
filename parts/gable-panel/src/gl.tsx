import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { ExtrudeGeometry, MeshLambertMaterial, Shape } from 'three'
import type { GablePanelGlValue } from './types'

export function PartsGl(
  props: PartsGlProps<GablePanelGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="gable-panels">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<GablePanelGlValue>, 'parts'> & {
  part: GablePanelGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      baseInMeters,
      heightInMeters,
      depthInMeters,
      position,
      quaternion,
      scale,
      variant: { material },
    },
    onPartClick,
  } = props

  // Right triangle in XY: right angle at origin, base along X, height along Y.
  // After xyToYZTransform in creator: base→Y (along wall), height→Z (up), depth→X.
  const shape = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0)
    s.lineTo(baseInMeters, 0)
    s.lineTo(0, heightInMeters)
    s.closePath()
    return s
  }, [baseInMeters, heightInMeters])

  const geometry = useMemo(() => {
    return new ExtrudeGeometry(shape, { depth: depthInMeters, bevelEnabled: false })
  }, [shape, depthInMeters])

  const mat = useMemo(() => {
    return new MeshLambertMaterial({ color: material.color })
  }, [material.color])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`gable-panel-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'gable-panel' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <mesh
        name={`gable-panel-mesh-${id}`}
        geometry={geometry}
        material={mat}
        castShadow
        receiveShadow
      />
    </group>
  )
}
