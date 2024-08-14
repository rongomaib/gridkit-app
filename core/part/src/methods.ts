import { Box3 } from 'three'
import { getPartModule } from './modules'
import type { FasteningPoint, PartCreator, PartGlValue, WithRequiredId } from './types'

export function calculateGlValue(partCreator: WithRequiredId<PartCreator>): PartGlValue {
  const partModule = getPartModule(partCreator.spec.type)
  return partModule.methods.calculateGlValue(partCreator)
}
export function calculateGlValueForAll(
  partCreators: Array<WithRequiredId<PartCreator>>,
): Array<PartGlValue> {
  return partCreators.map(calculateGlValue)
}

export function calculateBoundingBox(partCreator: PartCreator): Box3 {
  const partModule = getPartModule(partCreator.spec.type)
  return partModule.methods.calculateBoundingBox(partCreator)
}
export function calculateBoundingBoxForAll(partCreators: Array<PartCreator>): Box3 {
  const boundingBoxes = partCreators.map(calculateBoundingBox)
  const boundingBox = boundingBoxes.reduce(
    (sofar: Box3, box: Box3) => sofar.clone().union(box),
    new Box3(),
  )
  return boundingBox
}

export function calculateFasteningPoints(
  partCreator: WithRequiredId<PartCreator>,
): Array<FasteningPoint> {
  const partModule = getPartModule(partCreator.spec.type)
  return partModule.methods.calculateFasteningPoints(partCreator)
}

export function calculateFasteningPointsForAll(
  partCreators: Array<WithRequiredId<PartCreator>>,
): Array<FasteningPoint> {
  return partCreators.flatMap(calculateFasteningPoints)
}

export function calculateNumFastenersToFasten(partCreator: PartCreator): number {
  const partModule = getPartModule(partCreator.spec.type)
  return partModule.methods.calculateNumFastenersToFasten(partCreator)
}
