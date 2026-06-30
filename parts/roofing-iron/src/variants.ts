import { millimeter } from '@villagekit/units'
import type { RoofingIronVariant } from './types'

export const roofingIronVariants: Record<string, RoofingIronVariant> = {
  RoofingIron_Galvanised: {
    id: 'RoofingIron_Galvanised',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#B8C4C8',
    },
  },
  RoofingIron_Zincalume: {
    id: 'RoofingIron_Zincalume',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#C8D4D8',
    },
  },
  RoofingIron_ColourSteel: {
    id: 'RoofingIron_ColourSteel',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    material: {
      color: '#4A5A5C',
    },
  },
}
