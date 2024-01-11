import { registerPartModule } from '@villagekit/part'

import { calculateState, GridBeamCreator } from './creators'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  calculateSummaryKey,
  calculateSummaryValue,
} from './methods'
import { PartsSummary } from './summary'
import { GridBeamGlValue, GridBeamState, GridBeamSummaryValue } from './types'
import { variants } from './variants'

export * from './svg'
export * from './types'
export * from './variants'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartCreator {
      gridbeam: GridBeamCreator
    }
    interface EveryPartState {
      gridbeam: GridBeamState
    }
    interface EveryPartVariants {
      gridbeam: typeof variants
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
  variants,
})
