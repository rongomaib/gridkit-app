import {
  AxisId,
  axisIdToDirection,
  axisIdToDirectionVector,
  directionToAxisId,
  flipAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import generateKey, { sorted as generateKeySorted } from 'deadbeef'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { GridPanel, GridPanelSpec } from './creator'
import type { GridPanelGlValue } from './types'
import { gridPanelVariants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)
const Y_AXIS = axisIdToDirectionVector(AxisId.Y)
const Z_AXIS = axisIdToDirectionVector(AxisId.Z)

export function calculateGlValue(creator: WithRequiredId<GridPanel>): GridPanelGlValue {
  const {
    type,
    id,
    spec: { variantId, sizeInGrids, holes },
    transform,
  } = creator

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const holeDiameterInMeters = convert(variant.holeDiameter, meter).value
  const thicknessInMeters = convert(variant.thickness, meter).value

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    variant,
    sizeInGrids,
    holes,
    gridLengthInMeters,
    holeDiameterInMeters,
    thicknessInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: GridPanel): Box3 {
  const {
    spec: { variantId, sizeInGrids },
    transform,
  } = creator

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }
  const gridUnit = convert(variant.gridLength, meter).value
  const halfGridUnit = 0.5 * gridUnit

  const box = new Box3(
    new Vector3(-halfGridUnit, -halfGridUnit, -halfGridUnit),
    new Vector3(
      sizeInGrids[0] * gridUnit - halfGridUnit,
      sizeInGrids[1] * gridUnit - halfGridUnit,
      halfGridUnit,
    ),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateSummaryKey(part: GridPanelSpec): string {
  const { type, sizeInGrids, variantId } = part
  let { holes } = part

  if (typeof holes === 'boolean') {
    return generateKey(type, variantId, ...sizeInGrids, holes)
  }

  if (sizeInGrids[1] > sizeInGrids[0]) {
    // need to "rotate" panel so main length is larger side
    holes = holes.map((hole) => [hole[1], hole[0]])
  }

  return (
    generateKey(type, variantId, ...sizeInGrids) +
    generateKeySorted(...holes.map(([a, b]) => `${a},${b}`))
  )
}

export function calculateFasteningPoints(
  creator: WithRequiredId<GridPanel>,
): Array<FasteningPoint> {
  const {
    spec: { variantId, sizeInGrids, holes },
    transform,
  } = creator

  if (holes === false) return []

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const thicknessInMeters = convert(variant.thickness, meter).value
  const thicknessRatio = thicknessInMeters / gridLengthInMeters

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  matrix.setPosition(0, 0, 0)
  const mainDirection = X_AXIS.clone().applyMatrix4(matrix).toArray()
  const crossDirection = Y_AXIS.clone().applyMatrix4(matrix).toArray()
  const thicknessDirection = Z_AXIS.clone().applyMatrix4(matrix).toArray()

  const thicknessAxis = directionToAxisId(thicknessDirection)
  if (thicknessAxis == null) {
    throw new Error(
      `gridpanel thickness direction axis is not standard: [${thicknessDirection.join(', ')}]`,
    )
  }
  const fastenAxis = flipAxisId(thicknessAxis)
  const fastenDirection = axisIdToDirection(fastenAxis)

  // reverse the fit adjustment
  position.sub(
    new Vector3(...fastenDirection).multiplyScalar(0.5 * (gridLengthInMeters - thicknessInMeters)),
  )

  const [mainLength, crossLength] = sizeInGrids
  const start = position.clone().divideScalar(gridLengthInMeters).toArray()

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
        start[0] + crossDirection[0] * crossIndex + mainDirection[0] * mainIndex,
        start[1] + crossDirection[1] * crossIndex + mainDirection[1] * mainIndex,
        start[2] + crossDirection[2] * crossIndex + mainDirection[2] * mainIndex,
      ] as const

      const facePosition = [
        point[0] + fastenDirection[0] * 0.5 - fastenDirection[0] * thicknessRatio,
        point[1] + fastenDirection[1] * 0.5 - fastenDirection[1] * thicknessRatio,
        point[2] + fastenDirection[2] * 0.5 - fastenDirection[2] * thicknessRatio,
      ] as const

      const mainIndexHalved =
        mainIndex >= mainLength / 2 ? Math.abs(mainIndex - mainLength + 1) : mainIndex
      const mainIndexGradient = mapRange(mainIndexHalved, 0, Math.floor(mainLength / 2), 1, 0.5)

      const gradient = mapRange(crossIndexGradient * mainIndexGradient, 0.25, 1, 0, 1)

      fasteningPoints[holeIndex++] = {
        axis: fastenAxis,
        cellPosition: point,
        facePosition,
        gradient: gradient,
        part: creator,
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

export function calculateNumFastenersToFasten(_creator: GridPanel): number {
  return 2
}
