import { millimeter } from '@villagekit/units'
import type { RoofPanelVariant } from './types'

export const roofPanelVariants: Record<string, RoofPanelVariant> = {
  RoofPanel_TimberFrame: {
    id: 'RoofPanel_TimberFrame',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#A0876B',
    },
  },
}
