import {
  type AxisId,
  type Point3,
  axisIdToDirection,
  flipAxisId,
  pointEquals,
} from '@villagekit/math'
import {
  type FasteningPoint,
  type PartCreator,
  type WithRequiredId,
  calculateFasteningPointsForAll,
  calculateNumFastenersToFasten,
} from '@villagekit/part'
import { fastenerVariants } from '@villagekit/part-fastener'
import { Fastener } from '@villagekit/part-fastener/creator'
import {
  forEach,
  groupBy,
  intersectionWith,
  map,
  mapValues,
  maxBy,
  reduce,
  round,
  sortBy,
  sumBy,
  uniq,
  uniqWith,
} from 'lodash-es'
import { Line3, Vector3 } from 'three'

export type PossibleFastener = {
  fasteningPoints: Array<FasteningPoint>
  axis: AxisId
  startPoint: FasteningPoint
  endPoint: FasteningPoint
}

export function generateFastenerParts(
  partCreators: Array<WithRequiredId<PartCreator>>,
): Array<WithRequiredId<PartCreator>> {
  const fasteningPoints = calculateFasteningPointsForAll(partCreators)
  const fasteningMap = buildFasteningMap(fasteningPoints)
  const possibleFasteners = generatePossibleFasteners(fasteningMap)
  const chosenFasteners = generateFastenersByWeighting(possibleFasteners)
  const fastenerParts = buildFastenerParts(chosenFasteners)

  return fastenerParts
}

type FasteningMap = Record<string, FasteningCell>
type FasteningCell = {
  cellPosition: Point3
  fasteningPoints: FasteningPointByAxis
}
type FasteningPointByAxis = { [key in AxisId]?: FasteningPoint }

function buildFasteningMap(fasteningPoints: Array<FasteningPoint>) {
  return reduce<FasteningPoint, FasteningMap>(
    fasteningPoints,
    (sofar, fasteningPoint) => {
      const cellKey = fasteningPoint.cellPosition.map(Math.round).join(',')

      if (!(cellKey in sofar)) {
        sofar[cellKey] = {
          cellPosition: fasteningPoint.cellPosition,
          fasteningPoints: {},
        }
      }

      sofar[cellKey]!.fasteningPoints[fasteningPoint.axis] = fasteningPoint

      return sofar
    },
    {},
  )
}

function generatePossibleFasteners(fasteningMap: FasteningMap): Array<PossibleFastener> {
  const possibleFasteners = reduce<FasteningCell, Array<PossibleFastener>>(
    Object.values(fasteningMap),
    (sofar, cell) => {
      forEach(cell.fasteningPoints, (fasteningPointOrUndefined, axisString) => {
        const fasteningPoint = fasteningPointOrUndefined as FasteningPoint
        const axis = axisString as AxisId

        const oppositeFasteningPoint = cell.fasteningPoints[flipAxisId(axis)]
        // Return early if there is only a single fastening point e.g: panel
        if (oppositeFasteningPoint == null) return

        const expandedPointsFromStart: Array<FasteningPoint> = []
        const startPoint = expandCells(fasteningMap, fasteningPoint, expandedPointsFromStart)

        const expandedPointsFromEnd: Array<FasteningPoint> = []
        const endPoint = expandCells(fasteningMap, oppositeFasteningPoint, expandedPointsFromEnd)

        const expandedPoints: Array<FasteningPoint> = [
          ...expandedPointsFromStart.reverse(),
          ...expandedPointsFromEnd,
        ]

        if (!pointEquals(startPoint.cellPosition, endPoint.cellPosition)) {
          sofar.push({
            axis,
            endPoint,
            fasteningPoints: expandedPoints,
            startPoint,
          })
        }
      })

      return sofar
    },
    [],
  )

  return uniqWith(possibleFasteners, possibleFastenerEquals)
}

function possibleFastenerEquals(a: PossibleFastener, b: PossibleFastener) {
  return (
    arrayEqualsWith(a.fasteningPoints, b.fasteningPoints, fasteningPointEquals) &&
    a.axis === b.axis &&
    fasteningPointEquals(a.startPoint, b.startPoint) &&
    fasteningPointEquals(a.endPoint, b.endPoint)
  )
}

function arrayEqualsWith<T>(a: Array<T>, b: Array<T>, comparator: (a: T, b: T) => boolean) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!comparator(a[i]!, b[i]!)) return false
  }
  return true
}

function fasteningPointEquals(a: FasteningPoint, b: FasteningPoint) {
  return (
    pointEquals(a.cellPosition, b.cellPosition) &&
    pointEquals(a.facePosition, b.facePosition) &&
    a.axis === b.axis &&
    a.part === b.part &&
    a.gradient === b.gradient
  )
}

function expandCells(
  fasteningMap: FasteningMap,
  startingPoint: FasteningPoint,
  expandedPoints: Array<FasteningPoint>,
): FasteningPoint {
  const { axis } = startingPoint
  const flipAxis = flipAxisId(startingPoint.axis)

  expandedPoints.push(startingPoint)

  let currentPoint = startingPoint

  while (true) {
    const neighbourOffset = axisIdToDirection(currentPoint.axis)
    const neighbourCellPosition = [
      currentPoint.cellPosition[0] + neighbourOffset[0],
      currentPoint.cellPosition[1] + neighbourOffset[1],
      currentPoint.cellPosition[2] + neighbourOffset[2],
    ] as [number, number, number]
    const neighbourKey = neighbourCellPosition.map(Math.round).join(',')

    if (Object.prototype.hasOwnProperty.call(fasteningMap, neighbourKey)) {
      const neighbourCell = fasteningMap[neighbourKey]!

      const neighbourFasteningPointNear = neighbourCell.fasteningPoints[flipAxis]

      if (neighbourFasteningPointNear != null) {
        expandedPoints.push(neighbourFasteningPointNear)

        currentPoint = neighbourFasteningPointNear

        const neighbourFasteningPointFar = neighbourCell.fasteningPoints[axis]

        if (neighbourFasteningPointFar != null) {
          expandedPoints.push(neighbourFasteningPointFar)

          currentPoint = neighbourFasteningPointFar
          continue
        }
      }
    }

    break
  }

  return currentPoint
}

interface PartAdjacencyMap {
  [partPairId: string]: Array<PossibleFastener>
}
type PartPairPriorityOrder = Array<string>
interface PartPairById {
  [partPairId: string]: [PartCreator, PartCreator]
}

function derivePartAdjacencies(possibleFasteners: Array<PossibleFastener>): {
  partAdjacencyMap: PartAdjacencyMap
  partPairPriorityOrder: PartPairPriorityOrder
  partPairsById: PartPairById
} {
  const partPairsById: PartPairById = {}
  const partAdjacencyMap: PartAdjacencyMap = {}

  for (const possibleFastener of possibleFasteners) {
    const partPairs = getPartPairsFromFastener(possibleFastener)

    forEach(partPairs, (partPair) => {
      const [partA, partB] = sortPartPairs(...partPair)
      const partPairId = getPartPairId(partA, partB)

      if (!(partPairId in partPairsById)) {
        partPairsById[partPairId] = [partA, partB]
      }

      if (!(partPairId in partAdjacencyMap)) {
        partAdjacencyMap[partPairId] = []
      }

      partAdjacencyMap[partPairId]!.push(possibleFastener)
    })
  }

  // Prioritise connecting parts with fewer possible connections, e.g: beam to beam vs beam to panel
  const partPairPriorityOrder: PartPairPriorityOrder = map(
    sortBy(Object.entries(partAdjacencyMap), 'length'),
    ([partPairId, _]) => partPairId,
  )

  return { partAdjacencyMap, partPairPriorityOrder, partPairsById }
}

function getPartPairId(
  partA: WithRequiredId<PartCreator>,
  partB: WithRequiredId<PartCreator>,
): string {
  return `${partA.id}__${partB.id}`
}

function getPartPairsFromFastener(
  possibleFastener: PossibleFastener,
): Array<[WithRequiredId<PartCreator>, WithRequiredId<PartCreator>]> {
  const parts = uniq(map(possibleFastener.fasteningPoints, 'part'))
  return pairwise(parts)
}

function pairwise<T>(array: Array<T>): Array<[T, T]> {
  const result: Array<[T, T]> = new Array(array.length - 1)
  for (let i = 0, j = 1; j < array.length; i++, j++) {
    result[i] = [array[i]!, array[j]!]
  }
  return result
}

function sortPartPairs(
  partA: WithRequiredId<PartCreator>,
  partB: WithRequiredId<PartCreator>,
): [WithRequiredId<PartCreator>, WithRequiredId<PartCreator>] {
  if (partA.id.localeCompare(partB.id) <= 0) {
    return [partA, partB]
  }
  return [partB, partA]
}

type FastenerWeightMap = Map<PossibleFastener, number>
type FastenerCollisionMap = Map<PossibleFastener, boolean>
type ChosenFasteners = Array<PossibleFastener>
type PartPairChosenCounterMap = Record<string, number>

function generateFastenersByWeighting(
  possibleFasteners: Array<PossibleFastener>,
): Array<PossibleFastener> {
  const { partAdjacencyMap, partPairPriorityOrder, partPairsById } =
    derivePartAdjacencies(possibleFasteners)

  const fastenerWeightMap: FastenerWeightMap = new Map()
  const morePartsWithOneFastenerWeights =
    calculateMorePartsWithOneFastenerWeights(possibleFasteners)

  for (
    let possibleFastenerIndex = 0;
    possibleFastenerIndex < possibleFasteners.length;
    possibleFastenerIndex++
  ) {
    const possibleFastener = possibleFasteners[possibleFastenerIndex]!

    const morePartsWithOneFastener = morePartsWithOneFastenerWeights[possibleFastenerIndex]!
    const startAndEndOfPart = calculateStartAndEndOfPartWeight(possibleFastener)

    const weight = morePartsWithOneFastener + startAndEndOfPart

    fastenerWeightMap.set(possibleFastener, weight)
  }

  const fastenerCollisionMap: FastenerCollisionMap = new Map()
  const chosenFasteners: ChosenFasteners = []
  const partPairChosenCounterMap: PartPairChosenCounterMap = mapValues(partPairsById, () => 0)

  // For each possible part pair
  forEach(partPairPriorityOrder, (partPairId) => {
    const partPair = partPairsById[partPairId]
    const partPairFasteners = partAdjacencyMap[partPairId]!

    // Consider only subset of possible fasteners corresponding to part pair
    const partPairFastenersWeightMap = reduce<[PossibleFastener, number], FastenerWeightMap>(
      Array.from(fastenerWeightMap.entries()),
      (sofar, [possibleFastener, weight]) => {
        if (partPairFasteners.includes(possibleFastener)) {
          sofar.set(possibleFastener, weight)
        }
        return sofar
      },
      new Map(),
    )

    const numFastenersToFastenPartPair = Math.min(
      ...map(partPair, (part) => calculateNumFastenersToFasten(part)),
    )

    // Create fasteners until part pair is sufficiently fastened
    while (partPairChosenCounterMap[partPairId]! < numFastenersToFastenPartPair) {
      let partPairFastenersWeightMapEntries = Array.from(
        partPairFastenersWeightMap.entries(),
      ).filter(([possibleFastener, _]) => {
        // Ignore any possible fasteners that are already collided with
        return !fastenerCollisionMap.get(possibleFastener)
      })

      // If no possible fasteners available, early return
      if (partPairFastenersWeightMapEntries.length === 0) break

      // Apply dynamic weights
      const chosenPartPairFasteners = partPairFasteners.filter((partPairFastener) =>
        chosenFasteners.includes(partPairFastener),
      )

      partPairFastenersWeightMapEntries = map(
        partPairFastenersWeightMapEntries,
        ([possibleFastener, weight]) => {
          const dynamicWeight = calculateProximityAvoidanceWeight(
            possibleFastener,
            chosenPartPairFasteners,
          )

          return [possibleFastener, weight + dynamicWeight]
        },
      )

      // Find possible fastener with highest weighting
      const maxResult = maxBy(partPairFastenersWeightMapEntries, ([_, weight]) => weight)
      if (typeof maxResult === 'undefined') throw new Error('Unexpected')
      const chosenFastener = maxResult[0]

      chosenFasteners.push(chosenFastener)

      // Detect collisions between the chosen fastener and the other possible fasteners
      forEach(possibleFasteners, (possibleFastener) => {
        if (fastenerCollisionMap.get(possibleFastener)) {
          return // Possible fastener has already been collided with
        }

        const sharedFasteningPoints = intersectionWith(
          map(possibleFastener.fasteningPoints, 'cellPosition'),
          map(chosenFastener.fasteningPoints, 'cellPosition'),
          pointEquals,
        )

        if (sharedFasteningPoints.length > 0) {
          fastenerCollisionMap.set(possibleFastener, true)
        }
      })

      // Increment fastener counter for involved part pairs
      const partPairs = getPartPairsFromFastener(chosenFastener)
      forEach(partPairs, (partPair) => {
        const [partA, partB] = sortPartPairs(...partPair)
        const partPairId = getPartPairId(partA, partB)
        partPairChosenCounterMap[partPairId] += 1
      })
    }
  })

  return chosenFasteners
}

function calculateMorePartsWithOneFastenerWeights(
  possibleFasteners: Array<PossibleFastener>,
): Array<number> {
  const partCounts: Array<number> = map(possibleFasteners, (possibleFastener) => {
    const partIds = uniq(map(possibleFastener.fasteningPoints, 'part.id'))
    return partIds.length
  })

  const maxPartCount = Math.max(...partCounts)

  return map(partCounts, (partCount) => partCount / maxPartCount)
}

function calculateStartAndEndOfPartWeight(possibleFastener: PossibleFastener): number {
  const { fasteningPoints } = possibleFastener

  const maxResult = maxBy(fasteningPoints, (fasteningPoint) => fasteningPoint.gradient)

  if (typeof maxResult === 'undefined') throw new Error('Unexpected')

  return maxResult.gradient
}

function calculateProximityAvoidanceWeight(
  possibleFastener: PossibleFastener,
  chosenPartPairFasteners: Array<PossibleFastener>,
): number {
  return sumBy(chosenPartPairFasteners, (partPairFastener) => {
    // Only checking fastener start position for now, if this doesn't work in future we could
    // consider all fastening point positions and take an average
    return new Vector3(...possibleFastener.startPoint.cellPosition).distanceTo(
      new Vector3(...partPairFastener.startPoint.cellPosition),
    )
  })
}

function buildFastenerParts(
  chosenFasteners: Array<PossibleFastener>,
): Array<WithRequiredId<PartCreator>> {
  const groupedFasteners = groupBy(chosenFasteners, ({ startPoint, endPoint }) => {
    const fastenedLengthInGrids = round(
      new Line3(
        new Vector3(...startPoint.facePosition),
        new Vector3(...endPoint.facePosition),
      ).distance(),
      1,
    )

    return fastenedLengthInGrids * 40
  })

  const fastenerParts: Array<WithRequiredId<PartCreator>> = []

  forEach(groupedFasteners, (chosenFastenersForLength, fastenedLengthInMillimeters) => {
    const fasteners = map(chosenFastenersForLength, ({ axis, startPoint, endPoint }) => {
      // NOTE (mw): I'm not sure why fasteners are offset by 0.5 in the direction.
      const direction = axisIdToDirection(axis)
      const offset = [0.5 * direction[0], 0.5 * direction[1], 0.5 * direction[2]] as const
      const start: [number, number, number] = [
        offset[0] + startPoint.facePosition[0],
        offset[1] + startPoint.facePosition[1],
        offset[2] + startPoint.facePosition[2],
      ]
      const end: [number, number, number] = [
        offset[0] + endPoint.facePosition[0],
        offset[1] + endPoint.facePosition[1],
        offset[2] + endPoint.facePosition[2],
      ]
      return { start, end }
    })

    const variant = Object.values(fastenerVariants).find(
      (variant) => variant.fastenedLength.value === Number.parseFloat(fastenedLengthInMillimeters),
    )

    if (variant == null) {
      throw new Error(
        `Could not find fastener variant for given fastened length: ${fastenedLengthInMillimeters}mm`,
      )
    }

    for (let fastenerIndex = 0; fastenerIndex < fasteners.length; fastenerIndex++) {
      const fastener = fasteners[fastenerIndex]!
      fastenerParts.push(
        Fastener.Grid({
          ...fastener,
          id: `fasteners-${fastenedLengthInMillimeters}-${fastenerIndex}`,
          variantId: variant.id,
        }),
      )
    }
  })

  return fastenerParts
}
