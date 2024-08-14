import { registerPartModule } from '@villagekit/part'
import type { GridBeam, GridBeamSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { gridBeamSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { GridBeamGlValue, GridBeamType } from './types'
import { gridBeamVariants } from './variants'

export * from './svg/index'
export * from './types'
export { gridBeamVariants }

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridbeam: GridBeamType
    }
    interface EveryPartSpec {
      gridbeam: GridBeamSpec
    }
    interface EveryPartCreator {
      gridbeam: GridBeam
    }
    interface EveryPartVariants {
      gridbeam: typeof gridBeamVariants
    }
    interface EveryPartGlValue {
      gridbeam: GridBeamGlValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'gridbeam' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: gridBeamVariants,
  schemas: gridBeamSchemas,
})
