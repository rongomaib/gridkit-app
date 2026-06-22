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
    spec: { variantId, lengthInGrids, heightInGrids, depthInGrids },
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
  const lengthInMeters = lengthInGrids * gridLengthInMeters
  const heightInMeters = heightInGrids * gridLengthInMeters
  const depthInMeters = depthInGrids * gridLengthInMeters

  return {
    type,
    id,
    variant,
    gridLengthInMeters,
    depthInMeters,
    heightInMeters,
    lengthInGrids,
    heightInGrids,
    depthInGrids,
    lengthInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: PanelBrace): Box3 {
  const {
    spec: { variantId, lengthInGrids, heightInGrids, depthInGrids },
    transform,
  } = creator

  const variant = panelBraceVariants[variantId]
  if (variant == null) throw new Error(`Unknown panel-brace variant: ${variantId}`)

  const gridUnit = convert(variant.gridLength, meter).value
  const length = lengthInGrids * gridUnit
  const height = heightInGrids * gridUnit
  const halfDepth = (depthInGrids * gridUnit) / 2

  const box = new Box3(
    new Vector3(0, 0, -halfDepth),
    new Vector3(length, height, halfDepth),
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
