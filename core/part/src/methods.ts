import { Box3 } from 'three'

import { getPartModule } from './modules'
import {
  FasteningPoint,
  PartCreator,
  PartGlValue,
  PartModulesByType,
  PartState,
  PartSummaryValue,
} from './types'

export function calculateState(partCreator: PartCreator): PartState {
  const { type } = partCreator
  const partModuleType = (type.includes(':') ? type.split(':')[0] : type) as keyof PartModulesByType
  const partModule = getPartModule(partModuleType)
  // @ts-ignore
  return partModule.methods.calculateState(partCreator)
}
export function calculateStateForAll(partCreators: Array<PartCreator>) {
  return partCreators.map(calculateState)
}

export function calculateGlValue(partState: PartState): PartGlValue {
  const partModule = getPartModule(partState.type)
  // @ts-ignore
  return partModule.methods.calculateGlValue(partState)
}
export function calculateGlValueForAll(partStates: Array<PartState>): Array<PartGlValue> {
  return partStates.map(calculateGlValue)
}

export function calculateBoundingBox(partGlValue: PartGlValue): Box3 {
  const partModule = getPartModule(partGlValue.type)
  // @ts-ignore
  return partModule.methods.calculateBoundingBox(partGlValue)
}
export function calculateBoundingBoxForAll(partGlValues: Array<PartGlValue>) {
  const boundingBoxes = partGlValues.map(calculateBoundingBox)
  const boundingBox = boundingBoxes.reduce(
    (sofar: Box3, box: Box3) => sofar.clone().union(box),
    new Box3(),
  )
  return boundingBox
}

export function calculateSummaryValue(partState: PartState): PartSummaryValue {
  const partModule = getPartModule(partState.type)
  // @ts-ignore
  return partModule.methods.calculateSummaryValue(partState)
}
export function calculateSummaryKey(partSummaryValue: PartSummaryValue): string {
  const partModule = getPartModule(partSummaryValue.type)
  // @ts-ignore
  return partModule.methods.calculateSummaryKey(partState)
}
export function calculateSummaryValueForAll(partStates: Array<PartState>): Array<PartSummaryValue> {
  return partStates.map(calculateSummaryValue)
}

export function calculateFasteningPoints(partState: PartState): Array<FasteningPoint> {
  const partModule = getPartModule(partState.type)
  // @ts-ignore
  return partModule.methods.calculateFasteningPoints(partState)
}

export function calculateFasteningPointsForAll(
  partStates: Array<PartState>,
): Array<FasteningPoint> {
  return partStates.flatMap(calculateFasteningPoints)
}

export function calculateNumFastenersToFasten(partState: PartState): number {
  const partModule = getPartModule(partState.type)
  // @ts-ignore
  return partModule.methods.calculateNumFastenersToFasten(partState)
}
