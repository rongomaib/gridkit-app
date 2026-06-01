import { registerPartModule } from '@villagekit/part'
import type { Hinge, HingeSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { hingeSchemas } from './schemas'
import type { HingeGlValue, HingeType } from './types'
import { hingeVariants } from './variants'

export * from './types'
export { hingeVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      hinge: HingeType
    }
    interface EveryPartSpec {
      hinge: HingeSpec
    }
    interface EveryPartCreator {
      hinge: Hinge
    }
    interface EveryPartVariants {
      hinge: typeof hingeVariants
    }
    interface EveryPartGlValue {
      hinge: HingeGlValue
    }
  }
}

function HingeSvg() {
  return null
}

registerPartModule({
  labels: {
    single: 'hinge',
    plural: 'hinges',
  },
  components: {
    PartsGl,
    PartSvg: HingeSvg as any,
  },
  id: 'hinge' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: hingeVariants,
  schemas: hingeSchemas,
})
