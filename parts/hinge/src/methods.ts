import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { Hinge } from './creator'
import type { HingeGlValue } from './types'
import { hingeVariants } from './variants'

// Leaf physical dimensions (metres) — kept in sync with gl.tsx constants
const LEAF_WIDTH = 0.031
const LEAF_HEIGHT = 0.063
const LEAF_THICKNESS = 0.004

export function calculateGlValue(creator: WithRequiredId<Hinge>): HingeGlValue {
  const {
    type,
    id,
    spec: { variantId, angle },
    transform,
  } = creator

  const variant = hingeVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown hinge variant: ${variantId}`)
  }

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return { type, id, variant, angle, position, quaternion, scale }
}

export function calculateBoundingBox(creator: Hinge): Box3 {
  const { transform } = creator

  const box = new Box3(
    new Vector3(-LEAF_WIDTH, 0, -LEAF_THICKNESS / 2),
    new Vector3(LEAF_WIDTH, LEAF_HEIGHT, LEAF_THICKNESS / 2),
  )
  box.applyMatrix4(new Matrix4().fromArray(transform))
  return box
}

export function calculateFasteningPoints(_creator: WithRequiredId<Hinge>): Array<FasteningPoint> {
  return []
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<Hinge>): number {
  return 0
}
