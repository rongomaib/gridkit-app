import { registerPartModule } from '@villagekit/part'
import { type GridPanelCreator, calculateState } from './creators'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  calculateSummaryKey,
  calculateSummaryValue,
} from './methods'
import { gridPanelSchemas } from './schemas'
import { PartsSummary } from './summary'
import type {
  GridPanelGlValue,
  GridPanelState,
  GridPanelSummaryValue,
  GridPanelType,
} from './types'
import { gridPanelVariants } from './variants'

export * from './svg'
export * from './types'
export * from './variants'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridpanel: GridPanelType
    }
    interface EveryPartCreator {
      gridpanel: GridPanelCreator
    }
    interface EveryPartState {
      gridpanel: GridPanelState
    }
    interface EveryPartVariants {
      gridpanel: typeof gridPanelVariants
    }
    interface EveryPartGlValue {
      gridpanel: GridPanelGlValue
    }
    interface EveryPartSummaryValue {
      gridpanel: GridPanelSummaryValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'gridpanel' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    calculateState,
    calculateSummaryKey,
    calculateSummaryValue,
  },
  variants: gridPanelVariants,
  schemas: gridPanelSchemas,
})
