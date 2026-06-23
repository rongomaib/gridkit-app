import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type WallFrameType = 'wall-frame'

export type WallFrameVariant = {
  id: string
  gridLength: Length
  material: {
    color: string
  }
}

export type WallFrameGlValue = {
  type: WallFrameType
  id: string
  variant: WallFrameVariant
  widthInGrids: number
  heightInGrids: number
  widthInMeters: number
  heightInMeters: number
  depthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
