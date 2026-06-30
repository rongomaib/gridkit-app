import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type SteelGusset6mmType = 'steel-gusset-6mm'

export type SteelGusset6mmVariant = {
  id: string
  gridLength: Length
  sectionWidth: Length
  sectionDepth: Length
  material: {
    color: string
  }
}

export type SteelGusset6mmGlValue = {
  type: SteelGusset6mmType
  id: string
  variant: SteelGusset6mmVariant
  gridLengthInMeters: number
  sectionWidthInMeters: number
  sectionDepthInMeters: number
  lengthInGrids: number
  lengthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
