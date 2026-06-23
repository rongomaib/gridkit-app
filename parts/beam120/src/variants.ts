import { millimeter } from '@villagekit/units'
import type { Beam120Variant } from './types'

export const beam120Variants: Record<string, Beam120Variant> = {
  Beam120_Macrocarpa: {
    id: 'Beam120_Macrocarpa',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    sectionWidth: { type: 'quantity', unit: millimeter, value: 120 },
    sectionDepth: { type: 'quantity', unit: millimeter, value: 120 },
    material: {
      color: '#A0672A',
    },
  },
  Beam120_Aluminium6061: {
    id: 'Beam120_Aluminium6061',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    sectionWidth: { type: 'quantity', unit: millimeter, value: 120 },
    sectionDepth: { type: 'quantity', unit: millimeter, value: 120 },
    material: {
      color: '#A8A9AD',
    },
  },
  Beam120_Steel: {
    id: 'Beam120_Steel',
    gridLength: { type: 'quantity', unit: millimeter, value: 40 },
    sectionWidth: { type: 'quantity', unit: millimeter, value: 120 },
    sectionDepth: { type: 'quantity', unit: millimeter, value: 120 },
    material: {
      color: '#6B6F76',
    },
  },
}
