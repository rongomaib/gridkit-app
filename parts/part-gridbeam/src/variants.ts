import { millimeter } from '@villagekit/util-units'

import { GridBeamVariant } from './types'

export const gridBeamVariants: Record<string, GridBeamVariant> = {
  '40mm:8mm:douglas-fir': {
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
    id: '40mm:8mm:douglas-fir',
    materials: {
      beam: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
  },
}
