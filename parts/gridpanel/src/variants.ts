import { millimeter } from '@villagekit/units'
import type { GridPanelVariant } from './types'

export const gridPanelVariants: Record<string, GridPanelVariant> = {
  Grid40mm_Hole8mm_Thickness12mm_MaterialPlywood: {
    id: 'Grid40mm_Hole8mm_Thickness12mm_MaterialPlywood',
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
    thickness: {
      type: 'quantity',
      unit: millimeter,
      value: 12,
    },
    cornerRadius: {
      type: 'quantity',
      unit: millimeter,
      value: 2,
    },
    profileCutterDiameter: {
      type: 'quantity',
      unit: millimeter,
      value: 8,
    },
    materials: {
      panel: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
  },
}
