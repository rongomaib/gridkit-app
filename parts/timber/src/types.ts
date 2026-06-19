import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type TimberType = 'timber'

export type TimberVariant = {
  id: string
  gridLength: Length
  sectionWidth: Length
  sectionDepth: Length
  material: {
    color: string
  }
}

export type TimberGlValue = {
  type: TimberType
  id: string
  variant: TimberVariant
  gridLengthInMeters: number
  sectionWidthInMeters: number
  sectionDepthInMeters: number
  lengthInGrids: number
  lengthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
