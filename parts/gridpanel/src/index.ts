import { registerPartModule } from '@villagekit/part'
import type { GridPanel, GridPanelSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  exportDxf,
} from './methods'
import { gridPanelSchemas } from './schemas'
import { SummaryGridPanelSvg as PartSvg } from './svg/summary-grid-panel-svg'
import type { GridPanelGlValue, GridPanelType } from './types'
import { gridPanelVariants } from './variants'

export * from './svg/index'
export * from './types'
export { gridPanelVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridpanel: GridPanelType
    }
    interface EveryPartSpec {
      gridpanel: GridPanelSpec
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
  labels: {
    single: 'panel',
    plural: 'panels',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'gridpanel' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    exportDxf,
  },
  variants: gridPanelVariants,
  schemas: gridPanelSchemas,
})
