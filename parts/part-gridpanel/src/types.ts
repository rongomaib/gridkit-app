import type { BasePartSummaryValue } from '@villagekit/part-base'
import type { BaseGridPartState } from '@villagekit/part-base-grid'
import type { AxisId, Location } from '@villagekit/util-math'
import type { Length } from '@villagekit/util-units'

export type GridPanelType = 'gridpanel'

export interface GridPanelVariant {
  id: string
  gridLength: Length
  holeDiameter: Length
  thickness: Length
  materials: {
    panel: {
      textureUrl: string
    }
  }
}

export type GridPanelFit = 'top' | 'bottom'
export type GridPanelHoles = boolean | Array<[number, number]>

export interface GridPanelState extends BaseGridPartState {
  type: GridPanelType
  variant: GridPanelVariant
  mainAxis: AxisId
  mainStart: number
  mainLength: number
  crossAxis: AxisId
  crossStart: number
  crossLength: number
  thicknessAxis: AxisId
  thicknessStart: number
  fit?: GridPanelFit
  holes?: GridPanelHoles
}

export interface GridPanelGlValue extends GridPanelState {
  gridLengthInMeters: number
  holeDiameterInMeters: number
  thicknessInMeters: number
  locationInGrids: Location
  locationInMeters: Location
  sizeInMeters: [number, number, number]
}

export interface GridPanelSummaryValue extends BasePartSummaryValue {
  type: GridPanelType
  variant: GridPanelVariant
  sizeInGrids: [number, number]
  holes?: GridPanelHoles
}
