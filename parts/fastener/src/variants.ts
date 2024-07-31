// import { useGLTF } from '@react-three/drei'
import { millimeter } from '@villagekit/units'

import type { FastenerVariant } from './types'

const baseVariant: Omit<FastenerVariant, 'id' | 'boltLength' | 'fastenedLength' | 'nutLength'> = {
  boltDiameter: {
    type: 'quantity',
    unit: millimeter,
    value: 6,
  },
  boltLabel: 'bolt',
  endDiameter: {
    type: 'quantity',
    unit: millimeter,
    value: 12.5,
  },
  extrusionLength: {
    type: 'quantity',
    unit: millimeter,
    value: 3,
  },
  gridLength: {
    type: 'quantity',
    unit: millimeter,
    value: 40,
  },
  materials: {
    fastener: {
      textureUrl:
        'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1658725939/textures/metal_pmrsev.jpg',
    },
  },
  models: {
    fastener: {
      modelUrl:
        'https://res.cloudinary.com/villagekit/image/upload/v1669697321/models/fastener_mini_lyyka5.glb',
    },
  },
  nutDiameter: {
    type: 'quantity',
    unit: millimeter,
    value: 8,
  },
}

const boltLengths = {
  '35mm': {
    type: 'quantity',
    unit: millimeter,
    value: 35,
  },
  '75mm': {
    type: 'quantity',
    unit: millimeter,
    value: 75,
  },
  '115mm': {
    type: 'quantity',
    unit: millimeter,
    value: 115,
  },
  '155mm': {
    type: 'quantity',
    unit: millimeter,
    value: 155,
  },
  '195mm': {
    type: 'quantity',
    unit: millimeter,
    value: 195,
  },
} as const

const nutLengths = {
  '12mm': {
    type: 'quantity',
    unit: millimeter,
    value: 12,
  },
  '25mm': {
    type: 'quantity',
    unit: millimeter,
    value: 25,
  },
} as const

export const fastenerVariants: Record<string, FastenerVariant> = {
  '35mm:bolt:12mm:nut': {
    ...baseVariant,
    id: '35mm:bolt:12mm:nut',
    boltLength: boltLengths['35mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 40, // 1 beam
    },
    nutLength: nutLengths['12mm'],
  },
  '35mm:bolt:25mm:nut': {
    ...baseVariant,
    id: '35mm:bolt:25mm:nut',
    boltLength: boltLengths['35mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 52, // 1 beam + 1 panel
    },
    nutLength: nutLengths['25mm'],
  },
  '75mm:bolt:12mm:nut': {
    ...baseVariant,
    id: '75mm:bolt:12mm:nut',
    boltLength: boltLengths['75mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 80, // 2 beams
    },
    nutLength: nutLengths['12mm'],
  },
  '75mm:bolt:25mm:nut': {
    ...baseVariant,
    id: '75mm:bolt:25mm:nut',
    boltLength: boltLengths['75mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 92, // 2 beams + 1 panel
    },
    nutLength: nutLengths['25mm'],
  },
  '115mm:threaded-rod:12mm:nut': {
    ...baseVariant,
    id: '115mm:threaded-rod:12mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['115mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 120, // 3 beams
    },
    nutLength: nutLengths['12mm'],
  },
  '115mm:threaded-rod:25mm:nut': {
    ...baseVariant,
    id: '115mm:threaded-rod:25mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['115mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 132, // 3 beams + 1 panel
    },
    nutLength: nutLengths['25mm'],
  },
  '155mm:threaded-rod:12mm:nut': {
    ...baseVariant,
    id: '155mm:threaded-rod:12mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['155mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 160, // 4 beams
    },
    nutLength: nutLengths['12mm'],
  },
  '155mm:threaded-rod:25mm:nut': {
    ...baseVariant,
    id: '155mm:threaded-rod:25mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['155mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 172, // 4 beams + 1 panel
    },
    nutLength: nutLengths['25mm'],
  },
  '195mm:threaded-rod:12mm:nut': {
    ...baseVariant,
    id: '195mm:threaded-rod:12mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['195mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 200, // 5 beams
    },
    nutLength: nutLengths['12mm'],
  },
  '195mm:threaded-rod:25mm:nut': {
    ...baseVariant,
    id: '195mm:threaded-rod:25mm:nut',
    boltLabel: 'threaded rod',
    boltLength: boltLengths['195mm'],
    fastenedLength: {
      type: 'quantity',
      unit: millimeter,
      value: 212, // 5 beams + 1 panel
    },
    nutLength: nutLengths['25mm'],
  },
}

/*
export function preload() {
  // preload gltf models
  for (const variantId in fastenerVariants) {
    const variant = fastenerVariants[variantId]!
    const fastenerModel = variant.models.fastener
    useGLTF.preload(fastenerModel.modelUrl)
  }
}
*/
