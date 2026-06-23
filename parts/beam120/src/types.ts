import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type Beam120Type = 'beam120'

export type Beam120Variant = {
  id: string
  gridLength: Length
  sectionWidth: Length
  sectionDepth: Length
  material: {
    color: string
  }
}

export type Beam120GlValue = {
  type: Beam120Type
  id: string
  variant: Beam120Variant
  gridLengthInMeters: number
  sectionWidthInMeters: number
  sectionDepthInMeters: number
  lengthInGrids: number
  lengthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
