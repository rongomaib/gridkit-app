import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { WallFrame } from './creator'
import type { WallFrameGlValue } from './types'
import { wallFrameVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<WallFrame>): WallFrameGlValue {
  const {
    type,
    id,
    spec: { variantId, widthInGrids, heightInGrids, moduleType },
    transform,
  } = creator

  const variant = wallFrameVariants[variantId]
  if (variant == null) throw new Error(`Unknown wall-frame variant: ${variantId}`)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const widthInMeters = widthInGrids * gridLengthInMeters
  const heightInMeters = heightInGrids * gridLengthInMeters
  const depthInMeters = gridLengthInMeters

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    variant,
    widthInGrids,
    heightInGrids,
    widthInMeters,
    heightInMeters,
    depthInMeters,
    position,
    quaternion,
    scale,
    moduleType,
  }
}

export function calculateBoundingBox(creator: WallFrame): Box3 {
  const {
    spec: { variantId, widthInGrids, heightInGrids },
    transform,
  } = creator

  const variant = wallFrameVariants[variantId]
  if (variant == null) throw new Error(`Unknown wall-frame variant: ${variantId}`)

  const g = convert(variant.gridLength, meter).value

  const box = new Box3(new Vector3(0, 0, 0), new Vector3(widthInGrids * g, heightInGrids * g, g))

  box.applyMatrix4(new Matrix4().fromArray(transform))
  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<WallFrame>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<WallFrame>): number {
  return 0
}
