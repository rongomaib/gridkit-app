import { registerPartModule } from '@villagekit/part'
import './creator'
import type { RoofingIron, RoofingIronSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { roofingIronSchemas } from './schemas'
import { PartSvg } from './svg'
import type { RoofingIronGlValue, RoofingIronType } from './types'
import { roofingIronVariants } from './variants'

export * from './types'
export { roofingIronVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'roofing-iron': RoofingIronType
    }
    interface EveryPartSpec {
      'roofing-iron': RoofingIronSpec
    }
    interface EveryPartCreator {
      'roofing-iron': RoofingIron
    }
    interface EveryPartVariants {
      'roofing-iron': typeof roofingIronVariants
    }
    interface EveryPartGlValue {
      'roofing-iron': RoofingIronGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'Roofing iron',
    plural: 'Roofing iron',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'roofing-iron' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: roofingIronVariants,
  schemas: roofingIronSchemas,
})
