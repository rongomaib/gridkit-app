import weakMemoize from '@emotion/weak-memoize'
import type { FasteningPoint } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Quaternion, Vector3 } from 'three'

import type { FastenerGlValue, FastenerState, FastenerSummaryValue } from './types'

const X_AXIS = new Vector3(1, 0, 0)

const getGridLengthInMeters = weakMemoize((state: FastenerState): number => {
  const {
    variant: { gridLength },
  } = state

  return convert(gridLength, meter).value
})

export function calculateGlValue(state: FastenerState): FastenerGlValue {
  const {
    start,
    end,
    direction,
    variant: { extrusionLength, fastenedLength },
  } = state

  const extrusionLengthInMeters = convert(extrusionLength, meter).value
  const fastenedLengthInMeters = convert(fastenedLength, meter).value
  const gridLengthInMeters = getGridLengthInMeters(state)

  const position: FastenerGlValue['position'] = [
    ((start[0] + end[0]) * 0.5 + 0.5) * gridLengthInMeters,
    ((start[1] + end[1]) * 0.5 + 0.5) * gridLengthInMeters,
    ((start[2] + end[2]) * 0.5 + 0.5) * gridLengthInMeters,
  ]

  const quarternion: FastenerGlValue['quarternion'] = new Quaternion().setFromUnitVectors(
    X_AXIS,
    new Vector3(...direction),
  )

  return {
    ...state,
    extrusionLengthInMeters,
    fastenedLengthInMeters,
    position,
    quarternion,
  }
}

export function calculateBoundingBox(_value: FastenerGlValue): Box3 {
  return new Box3() // Does not apply to fastener part
}

export function calculateSummaryValue(state: FastenerState): FastenerSummaryValue {
  const { type, variant } = state

  return { type, variant }
}

export function calculateSummaryKey(summary: FastenerSummaryValue): string {
  const { type, variant } = summary

  return `${type}::${variant.id}`
}

export function calculateEstimatedPrice(_state: FastenerState): number {
  return 100
}

export function calculateFasteningPoints(_state: FastenerState): Array<FasteningPoint> {
  return [] // Does not apply to fastener part
}

export function calculateNumFastenersToFasten(_state: FastenerState): number {
  return 0
}
