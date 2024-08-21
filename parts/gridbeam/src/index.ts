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
import { SummaryGridBeamSvg as PartSvg } from './svg/summary-grid-beam-svg'
import type { GridBeamGlValue, GridBeamType } from './types'
import { gridBeamVariants } from './variants'

export * from './svg/index'
export * from './types'
export { gridBeamVariants }

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
  labels: {
    single: 'beam',
    plural: 'beams',
  },
  components: {
    PartsGl,
    PartSvg,
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
