import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type RoofingIronType = 'roofing-iron'

export type RoofingIronVariant = {
  id: string
  gridLength: Length
  material: {
    color: string
  }
}

export type RoofingIronGlValue = {
  type: RoofingIronType
  id: string
  slopedLengthGu: number
  widthInGrids: number
  offsetGu: number
  color: string
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
