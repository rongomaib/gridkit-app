import { AxisId, type Location } from '@villagekit/math'
import type { BasePartCreator } from '@villagekit/part/base'
import type { GridBeamState } from './types'
import { gridBeamVariants } from './variants'

export type GridBeamCreator = GridBeamX | GridBeamY | GridBeamZ

const getDefaultVariantId = () => '40mm:8mm:douglas-fir'

interface BaseOptions extends BasePartCreator {
  id: string
  variant?: keyof typeof gridBeamVariants
}

interface GridBeamX extends BaseOptions {
  type: 'gridbeam:x'
  x: [number, number]
  y: number
  z: number
}

function calculateXState(creator: GridBeamX): GridBeamState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId() } = creator

  const axis = x[0] <= x[1] ? AxisId.X : AxisId['-X']
  const locationInGrids: Location = [x[0], y, z]
  const lengthInGrids = Math.abs(x[0] - x[1])
  const variant = gridBeamVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridbeam variant: ${variantId}`)

  return {
    axis,
    id,
    lengthInGrids,
    locationInGrids,
    type: 'gridbeam',
    variant,
  }
}

interface GridBeamY extends BaseOptions {
  type: 'gridbeam:y'
  x: number
  y: [number, number]
  z: number
}
function calculateYState(creator: GridBeamY): GridBeamState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId() } = creator

  const axis = y[0] <= y[1] ? AxisId.Y : AxisId['-Y']
  const locationInGrids: Location = [x, y[0], z]
  const lengthInGrids = Math.abs(y[0] - y[1])
  const variant = gridBeamVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridbeam variant: ${variantId}`)

  return {
    axis,
    id,
    lengthInGrids,
    locationInGrids,
    type: 'gridbeam',
    variant,
  }
}

interface GridBeamZ extends BaseOptions {
  type: 'gridbeam:z'
  x: number
  y: number
  z: [number, number]
}
function calculateZState(creator: GridBeamZ): GridBeamState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId() } = creator

  const axis = z[0] <= z[1] ? AxisId.Z : AxisId['-Z']
  const locationInGrids: Location = [x, y, z[0]]
  const lengthInGrids = Math.abs(z[0] - z[1])
  const variant = gridBeamVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridbeam variant: ${variantId}`)

  return {
    axis,
    id,
    lengthInGrids,
    locationInGrids,
    type: 'gridbeam',
    variant,
  }
}

export function calculateState(creator: GridBeamCreator): GridBeamState {
  switch (creator.type) {
    case 'gridbeam:x':
      return calculateXState(creator)
    case 'gridbeam:y':
      return calculateYState(creator)
    case 'gridbeam:z':
      return calculateZState(creator)
  }
}
