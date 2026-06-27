import { registerPartModule } from '@villagekit/part'
import './creator'
import type { RoofPanel, RoofPanelSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { roofPanelSchemas } from './schemas'
import { PartSvg } from './svg'
import type { RoofPanelGlValue, RoofPanelType } from './types'
import { roofPanelVariants } from './variants'

export * from './types'
export { roofPanelVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'roof-panel': RoofPanelType
    }
    interface EveryPartSpec {
      'roof-panel': RoofPanelSpec
    }
    interface EveryPartCreator {
      'roof-panel': RoofPanel
    }
    interface EveryPartVariants {
      'roof-panel': typeof roofPanelVariants
    }
    interface EveryPartGlValue {
      'roof-panel': RoofPanelGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'Roof panel',
    plural: 'Roof panels',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'roof-panel' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: roofPanelVariants,
  schemas: roofPanelSchemas,
})
