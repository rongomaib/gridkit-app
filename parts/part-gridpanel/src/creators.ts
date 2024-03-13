import type { BasePartCreator } from '@villagekit/part-base'
import { AxisId } from '@villagekit/util-math'
import type { GridPanelState } from './types'
import { gridPanelVariants } from './variants'

export type GridPanelCreator = GridPanelXY | GridPanelYZ | GridPanelXZ

const getDefaultVariantId = (): keyof typeof gridPanelVariants => '40mm:8mm:12mm:douglas-fir'

interface BaseGridPanelOptions extends BasePartCreator {
  id: string
  variant?: keyof typeof gridPanelVariants
  fit?: GridPanelState['fit']
  holes?: GridPanelState['holes']
}

interface GridPanelXY extends BaseGridPanelOptions {
  type: 'gridpanel:xy'
  x: [number, number]
  y: [number, number]
  z: number
}

function calculateXYState(creator: GridPanelXY): GridPanelState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId(), fit, holes } = creator

  const mainAxis = AxisId.X
  const mainStart = Math.min(x[0], x[1])
  const mainLength = Math.abs(x[0] - x[1])
  const crossAxis = AxisId.Y
  const crossStart = Math.min(y[0], y[1])
  const crossLength = Math.abs(y[0] - y[1])
  const thicknessAxis = AxisId.Z
  const thicknessStart = z
  const variant = gridPanelVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridpanel variant: ${variantId}`)

  return {
    crossAxis,
    crossLength,
    crossStart,
    fit,
    holes,
    id,
    mainAxis,
    mainLength,
    mainStart,
    thicknessAxis,
    thicknessStart,
    type: 'gridpanel',
    variant,
  }
}

interface GridPanelYZ extends BaseGridPanelOptions {
  type: 'gridpanel:yz'
  x: number
  y: [number, number]
  z: [number, number]
}

function calculateYZState(creator: GridPanelYZ): GridPanelState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId(), fit, holes } = creator

  const mainAxis = AxisId.Y
  const mainStart = Math.min(y[0], y[1])
  const mainLength = Math.abs(y[0] - y[1])
  const crossAxis = AxisId.Z
  const crossStart = Math.min(z[0], z[1])
  const crossLength = Math.abs(z[0] - z[1])
  const thicknessAxis = AxisId.X
  const thicknessStart = x
  const variant = gridPanelVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridpanel variant: ${variantId}`)

  return {
    crossAxis,
    crossLength,
    crossStart,
    fit,
    holes,
    id,
    mainAxis,
    mainLength,
    mainStart,
    thicknessAxis,
    thicknessStart,
    type: 'gridpanel',
    variant,
  }
}

interface GridPanelXZ extends BaseGridPanelOptions {
  type: 'gridpanel:xz'
  x: [number, number]
  y: number
  z: [number, number]
}

function calculateXZState(creator: GridPanelXZ): GridPanelState {
  const { id, x, y, z, variant: variantId = getDefaultVariantId(), fit, holes } = creator

  const mainAxis = AxisId.X
  const mainStart = Math.min(x[0], x[1])
  const mainLength = Math.abs(x[0] - x[1])
  const crossAxis = AxisId.Z
  const crossStart = Math.min(z[0], z[1])
  const crossLength = Math.abs(z[0] - z[1])
  const thicknessAxis = AxisId.Y
  const thicknessStart = y
  const variant = gridPanelVariants[variantId]

  if (variant === undefined) throw new Error(`invalid gridpanel variant: ${variantId}`)

  return {
    crossAxis,
    crossLength,
    crossStart,
    fit,
    holes,
    id,
    mainAxis,
    mainLength,
    mainStart,
    thicknessAxis,
    thicknessStart,
    type: 'gridpanel',
    variant,
  }
}

export function calculateState(creator: GridPanelCreator): GridPanelState {
  switch (creator.type) {
    case 'gridpanel:xy':
      return calculateXYState(creator)
    case 'gridpanel:yz':
      return calculateYZState(creator)
    case 'gridpanel:xz':
      return calculateXZState(creator)
  }
}
