import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type GridBeamType = 'gridbeam'

export type GridBeamVariant = {
  id: string
  gridLength: Length
  holeDiameter: Length
  materials: {
    beam: {
      textureUrl: string
    }
  }
}

export type GridBeamGlValue = {
  type: GridBeamType
  id: string
  variant: GridBeamVariant
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  // length
  lengthInGrids: number
  lengthInMeters: number
  // transform
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
