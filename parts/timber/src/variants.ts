import { millimeter } from '@villagekit/units'
import type { TimberVariant } from './types'

export const timberVariants: Record<string, TimberVariant> = {
  Timber_120x120_SG8: {
    id: 'Timber_120x120_SG8',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    sectionWidth: { type: 'quantity', unit: millimeter, value: 120 },
    sectionDepth: { type: 'quantity', unit: millimeter, value: 120 },
    material: {
      color: '#C4956A',
    },
  },
}
