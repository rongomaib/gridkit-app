import { millimeter } from '@villagekit/units'
import type { GridBeamVariant } from './types'

export const gridBeamVariants: Record<string, GridBeamVariant> = {
  Grid40mm_Hole8mm_MaterialDouglasFir: {
    id: 'Grid40mm_Hole8mm_MaterialDouglasFir',
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
    materials: {
      beam: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
  },
}
