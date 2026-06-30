import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { RoofingIron } from './creator'
import type { RoofingIronGlValue } from './types'
import { roofingIronVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<RoofingIron>): RoofingIronGlValue {
  const {
    type,
    id,
    spec: { variantId, slopedLengthGu, widthInGrids, offsetGu },
    transform,
  } = creator

  const variant = roofingIronVariants[variantId]
  if (variant == null) throw new Error(`Unknown roofing-iron variant: ${variantId}`)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    slopedLengthGu,
    widthInGrids,
    offsetGu,
    color: variant.material.color,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: RoofingIron): Box3 {
  const {
    spec: { variantId, slopedLengthGu, widthInGrids, offsetGu },
    transform,
  } = creator

  const variant = roofingIronVariants[variantId]
  if (variant == null) throw new Error(`Unknown roofing-iron variant: ${variantId}`)

  const g = convert(variant.gridLength, meter).value
  const SHEET_THICKNESS = g * 0.5
  const RIB_HEIGHT = g * 0.3
  const box = new Box3(
    new Vector3(0, offsetGu * g, 0),
    new Vector3(slopedLengthGu * g, offsetGu * g + SHEET_THICKNESS + RIB_HEIGHT, widthInGrids * g),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))
  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<RoofingIron>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<RoofingIron>): number {
  return 0
}
