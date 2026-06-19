import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { Timber } from './creator'
import type { TimberGlValue } from './types'
import { timberVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<Timber>): TimberGlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = timberVariants[variantId]
  if (variant == null) throw new Error(`Unknown timber variant: ${variantId}`)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const sectionWidthInMeters = convert(variant.sectionWidth, meter).value
  const sectionDepthInMeters = convert(variant.sectionDepth, meter).value
  const lengthInMeters = lengthInGrids * gridLengthInMeters

  return {
    type,
    id,
    variant,
    gridLengthInMeters,
    sectionWidthInMeters,
    sectionDepthInMeters,
    lengthInGrids,
    lengthInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: Timber): Box3 {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = timberVariants[variantId]
  if (variant == null) throw new Error(`Unknown timber variant: ${variantId}`)

  const gridUnit = convert(variant.gridLength, meter).value
  const halfWidth = convert(variant.sectionWidth, meter).value / 2
  const halfDepth = convert(variant.sectionDepth, meter).value / 2

  const box = new Box3(
    new Vector3(0, -halfWidth, -halfDepth),
    new Vector3(lengthInGrids * gridUnit, halfWidth, halfDepth),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<Timber>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<Timber>): number {
  return 0
}
