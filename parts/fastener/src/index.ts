import { registerPartModule } from '@villagekit/part'
import type { Fastener, FastenerSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { fastenerSchemas } from './schemas'
import { FastenerSvg } from './svg'
import type { FastenerGlValue, FastenerType } from './types'
import { fastenerVariants } from './variants'

export * from './types'
export { fastenerVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridbeam: FastenerType
    }
    interface EveryPartSpec {
      fastener: FastenerSpec
    }
    interface EveryPartCreator {
      fastener: Fastener
    }
    interface EveryPartVariants {
      fastener: typeof fastenerVariants
    }
    interface EveryPartGlValue {
      fastener: FastenerGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'fastener',
    plural: 'fasteners',
  },
  components: {
    PartsGl,
    PartSvg: FastenerSvg,
  },
  id: 'fastener' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  schemas: fastenerSchemas,
  variants: fastenerVariants,
})
