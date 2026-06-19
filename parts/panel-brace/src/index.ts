import { registerPartModule } from '@villagekit/part'
import type { PanelBrace, PanelBraceSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { panelBraceSchemas } from './schemas'
import { PartSvg } from './svg'
import type { PanelBraceGlValue, PanelBraceType } from './types'
import { panelBraceVariants } from './variants'

export * from './types'
export { panelBraceVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'panel-brace': PanelBraceType
    }
    interface EveryPartSpec {
      'panel-brace': PanelBraceSpec
    }
    interface EveryPartCreator {
      'panel-brace': PanelBrace
    }
    interface EveryPartVariants {
      'panel-brace': typeof panelBraceVariants
    }
    interface EveryPartGlValue {
      'panel-brace': PanelBraceGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'panel brace',
    plural: 'panel braces',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'panel-brace' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: panelBraceVariants,
  schemas: panelBraceSchemas,
})
