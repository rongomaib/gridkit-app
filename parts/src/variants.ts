import { millimeter } from '@villagekit/units'
import type { SteelGusset6mmVariant } from './types'

export const steelGusset6mmVariants: Record<string, SteelGusset6mmVariant> = {
  '4_2_Steel_Gusset_Plate__6mm__80x160_Default': {
    id: '4_2_Steel_Gusset_Plate__6mm__80x160_Default',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    sectionWidth: { type: 'quantity', unit: millimeter, value: 80 },
    sectionDepth: { type: 'quantity', unit: millimeter, value: 160 },
    material: {
      color: '#6b7280',
    },
  },
}
