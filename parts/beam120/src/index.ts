import { registerPartModule } from '@villagekit/part'
import './creator'
import type { Beam120, Beam120Spec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { beam120Schemas } from './schemas'
import { PartSvg } from './svg'
import type { Beam120GlValue, Beam120Type } from './types'
import { beam120Variants } from './variants'

export * from './types'
export { beam120Variants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      beam120: Beam120Type
    }
    interface EveryPartSpec {
      beam120: Beam120Spec
    }
    interface EveryPartCreator {
      beam120: Beam120
    }
    interface EveryPartVariants {
      beam120: typeof beam120Variants
    }
    interface EveryPartGlValue {
      beam120: Beam120GlValue
    }
  }
}

registerPartModule({
  labels: {
    single: '120×120 beam',
    plural: '120×120 beams',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'beam120' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: beam120Variants,
  schemas: beam120Schemas,
})
