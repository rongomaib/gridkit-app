import { registerPartModule } from '@villagekit/part'
import './creator'
import type { GablePanel, GablePanelSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { gablePanelSchemas } from './schemas'
import { PartSvg } from './svg'
import type { GablePanelGlValue, GablePanelType } from './types'
import { gablePanelVariants } from './variants'

export * from './types'
export { gablePanelVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'gable-panel': GablePanelType
    }
    interface EveryPartSpec {
      'gable-panel': GablePanelSpec
    }
    interface EveryPartCreator {
      'gable-panel': GablePanel
    }
    interface EveryPartVariants {
      'gable-panel': typeof gablePanelVariants
    }
    interface EveryPartGlValue {
      'gable-panel': GablePanelGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'Gable panel',
    plural: 'Gable panels',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'gable-panel' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: gablePanelVariants,
  schemas: gablePanelSchemas,
})
