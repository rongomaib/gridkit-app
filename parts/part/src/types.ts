import { BasePartSummaryValue, PartsGlProps, PartsSummaryProps } from '@villagekit/part-base'
import { AxisId, Location } from '@villagekit/util-math'
import { ReactElement } from 'react'
import { Box3 } from 'three'
import { $Values } from 'utility-types'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace VK {
    export interface EveryPartCreator {
      noop: { type: 'noop'; id: string }
    }
    export interface EveryPartVariants {
      noop: { noop: null }
    }
    export interface EveryPartState {
      noop: { type: 'noop'; id: string }
    }
    export interface EveryPartGlValue {
      noop: { type: 'noop' }
    }
    export interface EveryPartSummaryValue {
      noop: { type: 'noop' }
    }
  }
}

export type PartCreator = $Values<VK.EveryPartCreator>
export type PartState = $Values<VK.EveryPartState>
export type PartGlValue = $Values<VK.EveryPartGlValue>
export type PartSummaryValue = $Values<VK.EveryPartSummaryValue>
export type PartGlValuesByType = {
  [Key in keyof VK.EveryPartGlValue]: Array<VK.EveryPartGlValue[Key]>
}
export type PartSummaryValueByType = {
  [Key in keyof VK.EveryPartSummaryValue]: VK.EveryPartSummaryValue[Key]
}
export type PartSummaryValuesByType = {
  [Key in keyof VK.EveryPartSummaryValue]: Array<VK.EveryPartSummaryValue[Key]>
}

export type FasteningPoint = {
  cellPosition: Location
  facePosition: Location
  axis: AxisId
  part: PartState
  gradient: number
}

export type CalculatePartState<Creator, State> = (creator: Creator) => State
export type CalculatePartGlValue<State, GlValue> = (state: State) => GlValue
export type CalculatePartBoundingBox<Value> = (value: Value) => Box3
export type CalculatePartSummaryValue<State, SummaryValue> = (state: State) => SummaryValue
export type CalculatePartSummaryKey<SummaryValue> = (state: SummaryValue) => string
export type CalculatePartFasteningPoints<State> = (state: State) => Array<FasteningPoint>
export type CalculateNumFastenersToFasten<State> = (state: State) => number

export type PartsGl<GlValue> = (props: PartsGlProps<GlValue>) => ReactElement | null
export type PartsSummary<SummaryValue extends BasePartSummaryValue> = (
  props: PartsSummaryProps<SummaryValue>,
) => ReactElement | null

export interface PartModule<
  Id extends PartState['type'],
  Creator extends PartCreator,
  State extends PartState,
  GlValue,
  SummaryValue extends BasePartSummaryValue,
  Variants,
> {
  id: Id
  variants: Variants
  components: {
    PartsSummary: PartsSummary<SummaryValue>
    PartsGl: PartsGl<GlValue>
  }
  methods: {
    calculateState: CalculatePartState<Creator, State>
    calculateGlValue: CalculatePartGlValue<State, GlValue>
    calculateBoundingBox: CalculatePartBoundingBox<GlValue>
    calculateSummaryValue: CalculatePartSummaryValue<State, SummaryValue>
    calculateSummaryKey: CalculatePartSummaryKey<SummaryValue>
    calculateFasteningPoints: CalculatePartFasteningPoints<State>
    calculateNumFastenersToFasten: CalculateNumFastenersToFasten<State>
  }
}

export type PartModulesByType = {
  [PT in PartState['type']]: PartModule<
    PT,
    VK.EveryPartCreator[PT],
    VK.EveryPartState[PT],
    VK.EveryPartGlValue[PT],
    VK.EveryPartSummaryValue[PT],
    VK.EveryPartVariants[PT]
  >
}

export type PartVariantsByType = {
  [PT in PartState['type']]: VK.EveryPartVariants[PT]
}
