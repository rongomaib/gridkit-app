import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type GridPanelType = 'gridpanel'

export interface GridPanelVariant {
  id: string
  gridLength: Length
  holeDiameter: Length
  thickness: Length
  cornerRadius: Length
  profileCutterDiameter: Length
  materials: {
    panel: {
      textureUrl: string
    }
  }
}

export type GridPanelFit = 'top' | 'bottom'
export type GridPanelHoleVariant = 'through' | 'half' | 'half-reverse'
export type GridPanelSpecHoleVariant = 'through' | 'half'
export type GridPanelHoles = boolean | Array<[number, number]>

export type GridPanelGlValue = {
  type: GridPanelType
  id: string
  variant: GridPanelVariant
  sizeInGrids: [number, number]
  holes: GridPanelHoles
  holeVariant: GridPanelSpecHoleVariant
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  thicknessInMeters: number
  // transform
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
