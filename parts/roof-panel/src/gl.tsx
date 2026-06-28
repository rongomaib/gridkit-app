import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { BoxGeometry, MeshLambertMaterial } from 'three'
import type { RoofPanelGlValue } from './types'

// All dimensions in metres; G = one grid unit = 40 mm
const G = 0.04
const EDGE_BEAM_H = 3 * G // 120 mm — edge beam depth
const EDGE_BEAM_W = 1 * G // 40 mm  — edge beam width
const PURLIN_SIZE = 1 * G // 40 mm  — purlin square cross-section
const PURLIN_SPACING = 15 * G // 600 mm — centre-to-centre spacing along slope

export function PartsGl(
  props: PartsGlProps<RoofPanelGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="roof-panels">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<RoofPanelGlValue>, 'parts'> & {
  part: RoofPanelGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: { id, lengthInGrids, widthInGrids, color, position, quaternion, scale },
    onPartClick,
  } = props

  // Canonical space:
  //   X axis — slope direction (sloped length)
  //   Y axis — outward normal to roof surface (edge beam depth)
  //   Z axis — width direction (world X)
  const L = lengthInGrids * G // sloped length in metres
  const W = widthInGrids * G // width in metres (1200 mm)

  // Edge beams: long axis along canonical X, one at each long edge (Z = 0 and Z = W)
  const edgeBeamGeo = useMemo(() => {
    return new BoxGeometry(L, EDGE_BEAM_H, EDGE_BEAM_W)
  }, [L])

  // Purlins: long axis along canonical Z (the width direction), square cross-section
  const purlinGeo = useMemo(() => {
    return new BoxGeometry(PURLIN_SIZE, PURLIN_SIZE, W)
  }, [W])

  const mat = useMemo(() => {
    return new MeshLambertMaterial({ color })
  }, [color])

  // One purlin at each multiple of PURLIN_SPACING along canonical X
  const purlinCount = Math.floor(L / PURLIN_SPACING) + 1
  const purlinPositions = useMemo(() => {
    return Array.from({ length: purlinCount }, (_, i) => ({
      x: i * PURLIN_SPACING + PURLIN_SIZE / 2,
      y: EDGE_BEAM_H + PURLIN_SIZE / 2,
      z: W / 2,
    }))
  }, [purlinCount, W])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`roof-panel-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'roof-panel' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      {/* Edge beam along the low-Z long edge */}
      <mesh
        name={`roof-panel-edge-beam-1-${id}`}
        geometry={edgeBeamGeo}
        material={mat}
        position={[L / 2, EDGE_BEAM_H / 2, EDGE_BEAM_W / 2]}
        castShadow
        receiveShadow
      />
      {/* Edge beam along the high-Z long edge */}
      <mesh
        name={`roof-panel-edge-beam-2-${id}`}
        geometry={edgeBeamGeo}
        material={mat}
        position={[L / 2, EDGE_BEAM_H / 2, W - EDGE_BEAM_W / 2]}
        castShadow
        receiveShadow
      />
      {/* Purlins at regular intervals along the slope */}
      {purlinPositions.map((pos, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: index is stable for a fixed purlin layout
          key={i}
          name={`roof-panel-purlin-${i}-${id}`}
          geometry={purlinGeo}
          material={mat}
          position={[pos.x, pos.y, pos.z]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}
