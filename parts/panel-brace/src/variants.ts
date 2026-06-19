import { millimeter } from '@villagekit/units'
import type { PanelBraceVariant } from './types'

export const panelBraceVariants: Record<string, PanelBraceVariant> = {
  Ply_120x800: {
    id: 'Ply_120x800',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    depth: { type: 'quantity', unit: millimeter, value: 120 },
    height: { type: 'quantity', unit: millimeter, value: 800 },
    material: {
      color: '#D4B483',
    },
  },
}
