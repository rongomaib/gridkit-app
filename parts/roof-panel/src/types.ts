import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type RoofPanelType = 'roof-panel'

export type RoofPanelVariant = {
  id: string
  gridLength: Length
  material: {
    color: string
  }
}

export type RoofPanelGlValue = {
  type: RoofPanelType
  id: string
  lengthInGrids: number
  widthInGrids: number
  heightInGrids: number
  pitchDeg: number
  color: string
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
