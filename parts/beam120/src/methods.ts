import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { Beam120 } from './creator'
import type { Beam120GlValue } from './types'
import { beam120Variants } from './variants'

export function calculateGlValue(creator: WithRequiredId<Beam120>): Beam120GlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = beam120Variants[variantId]
  if (variant == null) throw new Error(`Unknown beam120 variant: ${variantId}`)

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

export function calculateBoundingBox(creator: Beam120): Box3 {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = beam120Variants[variantId]
  if (variant == null) throw new Error(`Unknown beam120 variant: ${variantId}`)

  const gridUnit = convert(variant.gridLength, meter).value
  const sectionWidth = convert(variant.sectionWidth, meter).value
  const sectionDepth = convert(variant.sectionDepth, meter).value

  const box = new Box3(
    new Vector3(0, 0, 0),
    new Vector3(lengthInGrids * gridUnit, sectionWidth, sectionDepth),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<Beam120>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<Beam120>): number {
  return 0
}
