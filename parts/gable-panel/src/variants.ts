import { millimeter } from '@villagekit/units'
import type { GablePanelVariant } from './types'

export const gablePanelVariants: Record<string, GablePanelVariant> = {
  GablePanel_MacrocarpaPlaster: {
    id: 'GablePanel_MacrocarpaPlaster',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#D4C4A0',
    },
  },
}
