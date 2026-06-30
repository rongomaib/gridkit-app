import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import { BoxGeometry, MeshStandardMaterial } from 'three'
import type { RoofingIronGlValue } from './types'

// All dimensions in metres; G = one grid unit = 40 mm
const G = 0.04
const SHEET_THICKNESS = G * 0.5  // 20 mm — thin but visible
const RIB_HEIGHT = G * 0.3       // 12 mm raised corrugations
const RIB_WIDTH = G * 0.5        // 20 mm rib width
const RIB_SPACING = G * 3        // 120 mm centre-to-centre — visible at house scale

export function PartsGl(
  props: PartsGlProps<RoofingIronGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="roofing-iron">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<RoofingIronGlValue>, 'parts'> & {
  part: RoofingIronGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: { id, slopedLengthGu, widthInGrids, offsetGu, color, position, quaternion, scale },
    onPartClick,
  } = props

  // Canonical space coordinates:
  //   X axis — slope direction (along roof slope from back to front)
  //   Y axis — outward normal to roof surface
  //   Z axis — world X (width across the roof)
  const L = slopedLengthGu * G
  const W = widthInGrids * G
  const Y0 = offsetGu * G  // bottom face of sheet in canonical Y (on top of purlins)

  const sheetGeo = useMemo(() => {
    return new BoxGeometry(L, SHEET_THICKNESS, W)
  }, [L, W])

  const ribGeo = useMemo(() => {
    return new BoxGeometry(L, RIB_HEIGHT, RIB_WIDTH)
  }, [L])

  const mat = useMemo(() => {
    return new MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45 })
  }, [color])

  // Ribs spaced evenly across the width, centred in the sheet
  const ribCount = Math.max(1, Math.floor(W / RIB_SPACING))
  const ribMargin = (W - ribCount * RIB_SPACING) / 2
  const ribPositions = useMemo(() => {
    return Array.from({ length: ribCount }, (_, i) => ({
      z: ribMargin + (i + 0.5) * RIB_SPACING,
    }))
  }, [ribCount, ribMargin])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`roofing-iron-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'roofing-iron' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      {/* Base sheet */}
      <mesh
        name={`roofing-iron-sheet-${id}`}
        geometry={sheetGeo}
        material={mat}
        position={[L / 2, Y0 + SHEET_THICKNESS / 2, W / 2]}
        castShadow
        receiveShadow
      />
      {/* Corrugation ribs */}
      {ribPositions.map((pos, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable layout for a fixed rib count
          key={i}
          name={`roofing-iron-rib-${i}-${id}`}
          geometry={ribGeo}
          material={mat}
          position={[L / 2, Y0 + SHEET_THICKNESS + RIB_HEIGHT / 2, pos.z]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}
