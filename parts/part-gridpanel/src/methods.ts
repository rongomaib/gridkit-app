import { FasteningPoint } from '@villagekit/part'
import {
  axisIdToDirection,
  AxisValues,
  axisValuesToVector,
  flipAxisId,
  mapRange,
} from '@villagekit/util-math'
import { convert, meter } from '@villagekit/util-units'
import generateKey, { sorted as generateKeySorted } from 'deadbeef'
import { Box3, Vector3 } from 'three'

import { GridPanelGlValue, GridPanelState, GridPanelSummaryValue } from './types'

export function calculateGlValue(state: GridPanelState): GridPanelGlValue {
  const {
    variant: { gridLength, holeDiameter, thickness },
    fit = 'bottom',
    mainAxis,
    mainStart,
    mainLength,
    crossAxis,
    crossStart,
    crossLength,
    thicknessAxis,
    thicknessStart,
  } = state

  const gridLengthInMeters = convert(gridLength, meter).value
  const holeDiameterInMeters = convert(holeDiameter, meter).value
  const thicknessInMeters = convert(thickness, meter).value

  const sizeInMeters = axisValuesToVector({
    [crossAxis]: crossLength * gridLengthInMeters,
    [mainAxis]: mainLength * gridLengthInMeters,
    [thicknessAxis]: thicknessInMeters,
  } as AxisValues) as GridPanelGlValue['sizeInMeters']

  const fitAdjustment = axisValuesToVector({
    [crossAxis]: 0,
    [mainAxis]: 0,
    [thicknessAxis]: fit === 'top' ? gridLengthInMeters - thicknessInMeters : 0,
  } as AxisValues)

  const locationInGrids = axisValuesToVector({
    [crossAxis]: crossStart,
    [mainAxis]: mainStart,
    [thicknessAxis]: thicknessStart,
  } as AxisValues)
  const locationInMeters = [
    locationInGrids[0] * gridLengthInMeters + fitAdjustment[0],
    locationInGrids[1] * gridLengthInMeters + fitAdjustment[1],
    locationInGrids[2] * gridLengthInMeters + fitAdjustment[2],
  ] as [number, number, number]

  return {
    ...state,
    crossAxis,
    crossLength,
    fit,
    gridLengthInMeters,
    holeDiameterInMeters,
    locationInGrids,
    locationInMeters,
    mainAxis,
    mainLength,
    sizeInMeters,
    thicknessAxis,
    thicknessInMeters,
  }
}

export function calculateBoundingBox(value: GridPanelGlValue): Box3 {
  const { sizeInMeters, locationInMeters } = value

  return new Box3().setFromPoints([
    new Vector3(...locationInMeters),
    new Vector3(...locationInMeters).add(new Vector3(...sizeInMeters)),
  ])
}

export function calculateSummaryValue(state: GridPanelState): GridPanelSummaryValue {
  const { type, variant, mainLength, crossLength } = state

  let sizeInGrids: [number, number] = [mainLength, crossLength]
  let { holes } = state

  if (crossLength > mainLength) {
    // need to "rotate" panel so main length is larger side
    sizeInGrids = [crossLength, mainLength]
    holes =
      typeof holes === 'undefined' || typeof holes === 'boolean'
        ? holes
        : holes.map((hole) => [hole[1], hole[0]])
  }

  return {
    holes,
    sizeInGrids,
    type,
    variant,
  }
}

export function calculateSummaryKey(summary: GridPanelSummaryValue): string {
  const { type, holes = true, sizeInGrids, variant } = summary

  if (typeof holes === 'boolean') {
    return generateKey(type, variant.id, ...sizeInGrids, holes)
  } else {
    return (
      generateKey(type, variant.id, ...sizeInGrids) +
      generateKeySorted(...holes.map(([a, b]) => `${a},${b}`))
    )
  }
}

export function calculateFasteningPoints(state: GridPanelState): Array<FasteningPoint> {
  const {
    fit,
    crossAxis,
    crossStart,
    crossLength,
    mainAxis,
    mainLength,
    mainStart,
    thicknessAxis,
    thicknessStart,
    holes = true,
    variant: { gridLength, thickness },
  } = state

  if (holes === false) return []

  const mainAxisDirection = axisIdToDirection(mainAxis)
  const crossAxisDirection = axisIdToDirection(crossAxis)

  const start = axisValuesToVector({
    [crossAxis]: crossStart,
    [mainAxis]: mainStart,
    [thicknessAxis]: thicknessStart,
  } as AxisValues)

  const axis = fit !== 'top' ? flipAxisId(thicknessAxis) : thicknessAxis

  const offset = axisIdToDirection(axis)

  const direction = axisIdToDirection(axis)
  const thicknessRatio = thickness.value / gridLength.value

  const holesMap = holes === true ? true : getHolesMap(holes)

  const fasteningPoints: Array<FasteningPoint> =
    holes === true ? new Array(mainLength * crossLength) : new Array(holes.length)

  let holeIndex = 0
  for (let crossIndex = 0; crossIndex < crossLength; crossIndex++) {
    if (holesMap !== true && holesMap[crossIndex] === undefined) {
      continue
    }

    const crossIndexHalved =
      crossIndex >= crossLength / 2 ? Math.abs(crossIndex - crossLength + 1) : crossIndex
    const crossIndexGradient = mapRange(crossIndexHalved, 0, Math.floor(crossLength / 2), 1, 0.5)

    for (let mainIndex = 0; mainIndex < mainLength; mainIndex++) {
      if (holesMap !== true && holesMap?.[crossIndex]?.[mainIndex] === undefined) {
        continue
      }

      const point = [
        start[0] + crossAxisDirection[0] * crossIndex + mainAxisDirection[0] * mainIndex,
        start[1] + crossAxisDirection[1] * crossIndex + mainAxisDirection[1] * mainIndex,
        start[2] + crossAxisDirection[2] * crossIndex + mainAxisDirection[2] * mainIndex,
      ] as const

      const facePosition = [
        point[0] + offset[0] * 0.5 - direction[0] * thicknessRatio,
        point[1] + offset[1] * 0.5 - direction[1] * thicknessRatio,
        point[2] + offset[2] * 0.5 - direction[2] * thicknessRatio,
      ] as const

      const mainIndexHalved =
        mainIndex >= mainLength / 2 ? Math.abs(mainIndex - mainLength + 1) : mainIndex
      const mainIndexGradient = mapRange(mainIndexHalved, 0, Math.floor(mainLength / 2), 1, 0.5)

      const gradient = mapRange(crossIndexGradient * mainIndexGradient, 0.25, 1, 0, 1)

      fasteningPoints[holeIndex++] = {
        axis,
        cellPosition: point,
        facePosition,
        gradient: gradient,
        part: state,
      }
    }
  }

  return fasteningPoints
}

function getHolesMap(holes: Array<[number, number]>): Record<number, Record<number, true>> {
  const holesMap: Record<number, Record<number, true>> = {}
  for (let index = 0; index < holes.length; index++) {
    const hole = holes[index]
    if (hole === undefined) continue
    const [hole0, hole1] = hole
    const nextHoles = holesMap[hole0] ?? {}
    nextHoles[hole1] = true
    holesMap[hole0] = nextHoles
  }
  return holesMap
}

export function calculateNumFastenersToFasten(_state: GridPanelState): number {
  return 2
}
