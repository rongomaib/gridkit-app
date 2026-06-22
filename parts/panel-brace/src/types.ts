import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type PanelBraceType = 'panel-brace'

export type PanelBraceVariant = {
  id: string
  gridLength: Length
  depth: Length
  height: Length
  material: {
    color: string
  }
}

export type PanelBraceGlValue = {
  type: PanelBraceType
  id: string
  variant: PanelBraceVariant
  gridLengthInMeters: number
  depthInMeters: number
  heightInMeters: number
  lengthInGrids: number
  heightInGrids: number
  depthInGrids: number
  lengthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
