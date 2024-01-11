import { registerPartModule } from '@villagekit/part'

import { calculateState, GridPanelCreator } from './creators'
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
import { GridPanelGlValue, GridPanelState, GridPanelSummaryValue } from './types'
import { variants } from './variants'

export * from './svg'
export * from './types'
export * from './variants'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartCreator {
      gridpanel: GridPanelCreator
    }
    interface EveryPartState {
      gridpanel: GridPanelState
    }
    interface EveryPartVariants {
      gridpanel: typeof variants
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
  variants,
})
