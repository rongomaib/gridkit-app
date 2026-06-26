import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type GablePanelType = 'gable-panel'

export type GablePanelVariant = {
  id: string
  gridLength: Length
  material: {
    color: string
  }
}

export type GablePanelGlValue = {
  type: GablePanelType
  id: string
  variant: GablePanelVariant
  baseInGrids: number
  heightInGrids: number
  baseInMeters: number
  heightInMeters: number
  depthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
