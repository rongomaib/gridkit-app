import { millimeter } from '@villagekit/units'
import type { GridPanelVariant } from './types'

export const gridPanelVariants: Record<string, GridPanelVariant> = {
  '40mm:8mm:12mm:douglas-fir': {
    gridLength: {
      type: 'quantity',
      unit: millimeter,
      value: 40,
    },
    holeDiameter: {
      type: 'quantity',
      unit: millimeter,
      value: 8,
    },
    id: '40mm:8mm:12mm:douglas-fir',
    materials: {
      panel: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
    thickness: {
      type: 'quantity',
      unit: millimeter,
      value: 12,
    },
  },
}
