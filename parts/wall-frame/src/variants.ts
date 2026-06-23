import { millimeter } from '@villagekit/units'
import type { WallFrameVariant } from './types'

export const wallFrameVariants: Record<string, WallFrameVariant> = {
  WallFrame_MacrocarpaPlaster: {
    id: 'WallFrame_MacrocarpaPlaster',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#D4C4A0',
    },
  },
}
