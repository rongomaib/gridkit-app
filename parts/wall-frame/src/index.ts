import { registerPartModule } from '@villagekit/part'
import './creator'
import type { WallFrame, WallFrameSpec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { wallFrameSchemas } from './schemas'
import { PartSvg } from './svg'
import type { WallFrameGlValue, WallFrameType } from './types'
import { wallFrameVariants } from './variants'

export * from './types'
export { wallFrameVariants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      'wall-frame': WallFrameType
    }
    interface EveryPartSpec {
      'wall-frame': WallFrameSpec
    }
    interface EveryPartCreator {
      'wall-frame': WallFrame
    }
    interface EveryPartVariants {
      'wall-frame': typeof wallFrameVariants
    }
    interface EveryPartGlValue {
      'wall-frame': WallFrameGlValue
    }
  }
}

registerPartModule({
  labels: {
    single: 'Wall frame module',
    plural: 'Wall frame modules',
  },
  components: {
    PartsGl,
    PartSvg,
  },
  id: 'wall-frame' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: wallFrameVariants,
  schemas: wallFrameSchemas,
})
