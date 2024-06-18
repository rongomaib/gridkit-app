import type { BasePartSummaryValue } from '@villagekit/part/base'
import type { BaseGridPartState } from '@villagekit/part/base/grid'
import type { AxisId, Direction, Location, ScaleX } from '@villagekit/util-math'
import type { Length } from '@villagekit/util-units'
import type { Quaternion } from 'three'

export type GridBeamType = 'gridbeam'

export interface GridBeamVariant {
  id: string
  gridLength: Length
  holeDiameter: Length
  materials: {
    beam: {
      textureUrl: string
    }
  }
}

export interface GridBeamState extends BaseGridPartState {
  type: GridBeamType
  variant: GridBeamVariant
  axis: AxisId
  locationInGrids: Location
  lengthInGrids: ScaleX
}

export interface GridBeamGlValue extends GridBeamState {
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  // axis
  direction: Direction
  quaternion: Quaternion
  // location
  locationInMeters: Location
  position: [number, number, number]
  // length
  lengthInGrids: ScaleX
  lengthInMeters: ScaleX
  // size
  sizeInGrids: [number, number, number]
  sizeInMeters: [number, number, number]
}

export interface GridBeamSummaryValue extends BasePartSummaryValue {
  type: GridBeamType
  variant: GridBeamVariant
  lengthInGrids: ScaleX
}
