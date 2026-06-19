import { registerPartModule } from '@villagekit/part'
import type { Timber, TimberSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { timberSchemas } from './schemas'
import { PartSvg } from './svg'
import type { TimberGlValue, TimberType } from './types'
import { timberVariants } from './variants'

export * from './types'
export { timberVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      timber: TimberType
    }
    interface EveryPartSpec {
      timber: TimberSpec
    }
    interface EveryPartCreator {
      timber: Timber
    }
    interface EveryPartVariants {
      timber: typeof timberVariants
    }
    interface EveryPartGlValue {
      timber: TimberGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'timber post',
    plural: 'timber posts',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'timber' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: timberVariants,
  schemas: timberSchemas,
})
