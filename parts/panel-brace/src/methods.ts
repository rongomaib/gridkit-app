import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { PanelBrace } from './creator'
import type { PanelBraceGlValue } from './types'
import { panelBraceVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<PanelBrace>): PanelBraceGlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = panelBraceVariants[variantId]
  if (variant == null) throw new Error(`Unknown panel-brace variant: ${variantId}`)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const depthInMeters = convert(variant.depth, meter).value
  const heightInMeters = convert(variant.height, meter).value
  const lengthInMeters = lengthInGrids * gridLengthInMeters

  return {
    type,
    id,
    variant,
    gridLengthInMeters,
    depthInMeters,
    heightInMeters,
    lengthInGrids,
    lengthInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: PanelBrace): Box3 {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = panelBraceVariants[variantId]
  if (variant == null) throw new Error(`Unknown panel-brace variant: ${variantId}`)

  const gridUnit = convert(variant.gridLength, meter).value
  const halfDepth = convert(variant.depth, meter).value / 2
  const height = convert(variant.height, meter).value

  const box = new Box3(
    new Vector3(0, -halfDepth, 0),
    new Vector3(lengthInGrids * gridUnit, halfDepth, height),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<PanelBrace>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<PanelBrace>): number {
  return 0
}
