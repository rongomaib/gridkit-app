import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { SteelGusset6mmGlValue } from './types'

// Auto-generated — edit to refine the 3-D object.
// Receives the full THREE namespace and spec dimension fields; returns a THREE.Group.
function buildCustomObject(
  mm: number,
  widthMm: number, heightMm: number, thicknessMm: number,
): THREE.Group {
  const group = new THREE.Group()
const t = thicknessMm * mm
const L = plateLengthMm * mm
const W = plateWidthMm * mm
const c = Math.min(cornerChamferMm * mm, L / 2, W / 2)

// Outline in X (length) / Y (width), centred on Y
const x0 = 0, x1 = L
const y0 = -W / 2, y1 = W / 2
const profile = new THREE.Shape()
profile.moveTo(x0 + c, y0)
profile.lineTo(x1 - c, y0)
profile.lineTo(x1, y0 + c)
profile.lineTo(x1, y1 - c)
profile.lineTo(x1 - c, y1)
profile.lineTo(x0 + c, y1)
profile.lineTo(x0, y1 - c)
profile.lineTo(x0, y0 + c)
profile.closePath()

// 8mm bolt-hole grid: 20mm inset, 40mm spacing
const r = 4 * mm
const off = 20 * mm
const sp = 40 * mm
const nx = Math.max(1, Math.round((plateLengthMm - 40) / 40) + 1)
const ny = Math.max(1, Math.round((plateWidthMm - 40) / 40) + 1)
for (let i = 0; i < nx; i++) {
  for (let j = 0; j < ny; j++) {
    const hx = off + i * sp
    const hy = -W / 2 + off + j * sp
    const hole = new THREE.Path()
    hole.absarc(hx, hy, r, 0, Math.PI * 2, true)
    profile.holes.push(hole)
  }
}

const geo = new THREE.ExtrudeGeometry(profile, { depth: t, bevelEnabled: false })
geo.rotateY(Math.PI / 2)        // extrude along +Z (thickness up)
geo.rotateX(Math.PI / 2)
group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#6b7280' })))
return group
}


export function PartsGl(
  props: PartsGlProps<SteelGusset6mmGlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="steelGusset6mms">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<SteelGusset6mmGlValue>, 'parts'> & {
  part: SteelGusset6mmGlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      sectionWidthInMeters,
      sectionDepthInMeters,
      position,
      quaternion,
      scale,
    },
    onPartClick,
  } = props

  const customObject = useMemo(() => buildCustomObject(
    1 / 1000,
    sectionWidthInMeters * 1000, sectionDepthInMeters * 1000, 6,
  ), [sectionWidthInMeters, sectionDepthInMeters])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={`steelGusset6mm-container-${id}`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: 'steel-gusset-6mm' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <primitive object={customObject} />
    </group>
  )
}
