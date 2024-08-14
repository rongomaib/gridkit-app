import {
  AxisId,
  type Point3,
  axisIdToDirection,
  axisIdToDirectionVector,
  directionToAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { GridBeam, GridBeamSpec } from './creator'
import type { GridBeamGlValue } from './types'
import { gridBeamVariants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)

export function calculateGlValue(creator: WithRequiredId<GridBeam>): GridBeamGlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const holeDiameterInMeters = convert(variant.holeDiameter, meter).value
  const lengthInMeters = lengthInGrids * gridLengthInMeters

  return {
    type,
    id,
    variant,
    gridLengthInMeters,
    holeDiameterInMeters,
    lengthInGrids,
    lengthInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: GridBeam): Box3 {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }
  const gridUnit = convert(variant.gridLength, meter).value
  const halfGridUnit = 0.5 * gridUnit

  const box = new Box3(
    new Vector3(-halfGridUnit, -halfGridUnit, -halfGridUnit),
    new Vector3(lengthInGrids * gridUnit - halfGridUnit, halfGridUnit, halfGridUnit),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateSummaryKey(creator: GridBeamSpec): string {
  const { type, variantId, lengthInGrids } = creator

  return `${type}::${variantId}::${lengthInGrids}`
}

const fasteningAxesByAxisId: Record<AxisId, Array<AxisId>> = {
  [AxisId.X]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId['-X']]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId.Y]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId['-Y']]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId.Z]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
  [AxisId['-Z']]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
}

export function calculateFasteningPoints(creator: WithRequiredId<GridBeam>): Array<FasteningPoint> {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const locationInGrids = position.clone().divideScalar(gridLengthInMeters).toArray()

  matrix.setPosition(0, 0, 0)
  const direction = X_AXIS.clone().applyMatrix4(matrix).toArray()
  const axis = directionToAxisId(direction)

  if (axis == null) {
    throw new Error(`gridbeam direction axis is not standard: [${direction.join(', ')}]`)
  }

  const points: Array<Point3> = new Array(lengthInGrids)
  for (let index = 0; index < lengthInGrids; index++) {
    points[index] = [
      locationInGrids[0] + direction[0] * index,
      locationInGrids[1] + direction[1] * index,
      locationInGrids[2] + direction[2] * index,
    ]
  }

  const fasteningAxes = fasteningAxesByAxisId[axis]
  const fasteningPoints: Array<FasteningPoint> = new Array(lengthInGrids * fasteningAxes.length)
  let fasteningPointIndex = 0
  for (
    let fasteningAxisIndex = 0;
    fasteningAxisIndex < fasteningAxes.length;
    fasteningAxisIndex++
  ) {
    const fasteningAxis = fasteningAxes[fasteningAxisIndex]
    if (fasteningAxis === undefined) throw new Error('unexpected: fasteningAxis is undefined')
    const offset = axisIdToDirection(fasteningAxis)

    for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
      const point = points[pointIndex]
      if (point === undefined) throw new Error('unexpected: point is undefined')
      const facePosition = [
        point[0] + offset[0] * 0.5,
        point[1] + offset[1] * 0.5,
        point[2] + offset[2] * 0.5,
      ] as [number, number, number]

      const iHalved =
        pointIndex >= lengthInGrids / 2 ? Math.abs(pointIndex - lengthInGrids + 1) : pointIndex
      const gradient = mapRange(iHalved, 0, Math.floor(lengthInGrids / 2), 1, 0)

      fasteningPoints[fasteningPointIndex++] = {
        axis: fasteningAxis,
        cellPosition: point,
        facePosition,
        gradient,
        part: creator,
      }
    }
  }

  return fasteningPoints
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<GridBeam>): number {
  return 2
}
