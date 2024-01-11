import { BasePartSummaryValue } from '@villagekit/part-base'
import { BaseGridPartState } from '@villagekit/part-base-grid'
import { AxisId, Direction, Location, ScaleX } from '@villagekit/util-math'
import { Length } from '@villagekit/util-units'
import { Quaternion } from 'three'

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
  type: 'gridbeam'
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
  type: GridBeamState['type']
  variant: GridBeamVariant
  lengthInGrids: ScaleX
}
