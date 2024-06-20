import { registerPartModule } from '@villagekit/part'
import { type FastenerCreator, calculateState } from './creators'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  calculateSummaryKey,
  calculateSummaryValue,
} from './methods'
import { fastenerSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { FastenerGlValue, FastenerState, FastenerSummaryValue, FastenerType } from './types'
import { fastenerVariants } from './variants'

export * from './types'
export * from './variants'

declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridbeam: FastenerType
    }
    interface EveryPartCreator {
      fastener: FastenerCreator
    }
    interface EveryPartState {
      fastener: FastenerState
    }
    interface EveryPartVariants {
      fastener: typeof fastenerVariants
    }
    interface EveryPartGlValue {
      fastener: FastenerGlValue
    }
    interface EveryPartSummaryValue {
      fastener: FastenerSummaryValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'fastener' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    calculateState,
    calculateSummaryKey,
    calculateSummaryValue,
  },
  schemas: fastenerSchemas,
  variants: fastenerVariants,
})
