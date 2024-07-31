import { registerPartModule } from '@villagekit/part'
import type { GridPanel } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { gridPanelSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { GridPanelGlValue, GridPanelType } from './types'
import { gridPanelVariants } from './variants'

export * from './svg/index'
export * from './types'
export { gridPanelVariants }

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridpanel: GridPanelType
    }
    interface EveryPartCreator {
      gridpanel: GridPanel
    }
    interface EveryPartVariants {
      gridpanel: typeof gridPanelVariants
    }
    interface EveryPartGlValue {
      gridpanel: GridPanelGlValue
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
  },
  variants: gridPanelVariants,
  schemas: gridPanelSchemas,
})
