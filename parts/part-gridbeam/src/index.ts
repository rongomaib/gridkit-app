import { registerPartModule } from '@villagekit/part'
import { type GridBeamCreator, calculateState } from './creators'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  calculateSummaryKey,
  calculateSummaryValue,
} from './methods'
import { gridBeamSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { GridBeamGlValue, GridBeamState, GridBeamSummaryValue, GridBeamType } from './types'
import { gridBeamVariants } from './variants'

export * from './svg/index'
export * from './types'
export * from './variants'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridbeam: GridBeamType
    }
    interface EveryPartCreator {
      gridbeam: GridBeamCreator
    }
    interface EveryPartState {
      gridbeam: GridBeamState
    }
    interface EveryPartVariants {
      gridbeam: typeof gridBeamVariants
    }
    interface EveryPartGlValue {
      gridbeam: GridBeamGlValue
    }
    interface EveryPartSummaryValue {
      gridbeam: GridBeamSummaryValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'gridbeam' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    calculateState,
    calculateSummaryKey,
    calculateSummaryValue,
  },
  variants: gridBeamVariants,
  schemas: gridBeamSchemas,
})
