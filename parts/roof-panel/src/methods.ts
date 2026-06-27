import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { RoofPanel } from './creator'
import type { RoofPanelGlValue } from './types'
import { roofPanelVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<RoofPanel>): RoofPanelGlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids, widthInGrids, heightInGrids, pitchDeg },
    transform,
  } = creator

  const variant = roofPanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown roof-panel variant: ${variantId}`)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    lengthInGrids,
    widthInGrids,
    heightInGrids,
    pitchDeg,
    color: variant.material.color,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: RoofPanel): Box3 {
  const {
    spec: { variantId, lengthInGrids, widthInGrids, heightInGrids },
    transform,
  } = creator

  const variant = roofPanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown roof-panel variant: ${variantId}`)

  const g = convert(variant.gridLength, meter).value
  // Conservative bounding box in canonical space before transform
  const box = new Box3(
    new Vector3(0, 0, 0),
    new Vector3(lengthInGrids * g, heightInGrids * g, widthInGrids * g),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))
  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<RoofPanel>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<RoofPanel>): number {
  return 0
}
