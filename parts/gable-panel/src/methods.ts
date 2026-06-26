import type { WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { GablePanel } from './creator'
import type { GablePanelGlValue } from './types'
import { gablePanelVariants } from './variants'

export function calculateGlValue(creator: WithRequiredId<GablePanel>): GablePanelGlValue {
  const {
    type,
    id,
    spec: { variantId, baseInGrids, heightInGrids },
    transform,
  } = creator

  const variant = gablePanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown gable-panel variant: ${variantId}`)

  const g = convert(variant.gridLength, meter).value

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    variant,
    baseInGrids,
    heightInGrids,
    baseInMeters: baseInGrids * g,
    heightInMeters: heightInGrids * g,
    depthInMeters: g,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: GablePanel): Box3 {
  const {
    spec: { variantId, baseInGrids, heightInGrids },
    transform,
  } = creator

  const variant = gablePanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown gable-panel variant: ${variantId}`)

  const g = convert(variant.gridLength, meter).value
  // Bounding box of the triangular prism (conservative: full rectangle)
  const box = new Box3(
    new Vector3(0, 0, 0),
    new Vector3(g, baseInGrids * g, heightInGrids * g),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))
  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<GablePanel>): [] {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<GablePanel>): number {
  return 0
}
