import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'

import weakMemoize from '@emotion/weak-memoize'
import type { Fastener, FastenerSpec } from './creator'
import type { FastenerGlValue, FastenerVariant } from './types'
import { fastenerVariants } from './variants'

const getExtrusionLength = weakMemoize(
  (variant: FastenerVariant) => convert(variant.extrusionLength, meter).value,
)

const getFastenedLength = weakMemoize(
  (variant: FastenerVariant) => convert(variant.fastenedLength, meter).value,
)

export function calculateGlValue(creator: WithRequiredId<Fastener>): FastenerGlValue {
  const { id, spec, transform } = creator
  const { type, variantId } = spec

  const variant = fastenerVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const extrusionLengthInMeters = getExtrusionLength(variant)
  const fastenedLengthInMeters = getFastenedLength(variant)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    variant,
    position,
    quaternion,
    extrusionLengthInMeters,
    fastenedLengthInMeters,
  }
}

export function calculateBoundingBox(_creator: Fastener): Box3 {
  return new Box3() // Does not apply to fastener part
}

export function calculateSummaryKey(spec: FastenerSpec): string {
  const { type, variantId } = spec

  return `${type}::${variantId}`
}

export function calculateFasteningPoints(
  _creator: WithRequiredId<Fastener>,
): Array<FasteningPoint> {
  return [] // Does not apply to fastener part
}

export function calculateNumFastenersToFasten(_creator: Fastener): number {
  return 0
}
