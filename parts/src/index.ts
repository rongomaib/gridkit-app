import { registerPartModule } from '@villagekit/part'
import './creator'
import type { SteelGusset6mm, SteelGusset6mmSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { steelGusset6mmSchemas } from './schemas'
import type { SteelGusset6mmGlValue, SteelGusset6mmType } from './types'
import { steelGusset6mmVariants } from './variants'

export * from './types'
export { steelGusset6mmVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'steel-gusset-6mm': SteelGusset6mmType
    }
    interface EveryPartSpec {
      'steel-gusset-6mm': SteelGusset6mmSpec
    }
    interface EveryPartCreator {
      'steel-gusset-6mm': SteelGusset6mm
    }
    interface EveryPartVariants {
      'steel-gusset-6mm': typeof steelGusset6mmVariants
    }
    interface EveryPartGlValue {
      'steel-gusset-6mm': SteelGusset6mmGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: '4×2 steel gusset plate (6mm)',
    plural: '4×2 steel gusset plate (6mm)s',
  },
  components: {
    PartsGl,
  },
  id: 'steel-gusset-6mm' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: steelGusset6mmVariants,
  schemas: steelGusset6mmSchemas,
})
