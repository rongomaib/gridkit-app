import { Vector3 as ThreeVector3 } from 'three'

export type Vector2<_Number = number> = Readonly<[number, number]>
export type Vector3<_Number = number> = Readonly<[number, number, number]>

export type Location = Vector3
export type Direction = Vector3
export type ScaleX = number
export type ScaleXY = Vector2
export type ScaleXYZ = Vector3

export enum AxisId {
  X = 'X',
  '-X' = '-X',
  Y = 'Y',
  '-Y' = '-Y',
  Z = 'Z',
  '-Z' = '-Z',
}

const directionByAxisId: Record<AxisId, Direction> = {
  [AxisId.X]: [1, 0, 0],
  [AxisId['-X']]: [-1, 0, 0],
  [AxisId.Y]: [0, 1, 0],
  [AxisId['-Y']]: [0, -1, 0],
  [AxisId.Z]: [0, 0, 1],
  [AxisId['-Z']]: [0, 0, -1],
} as const

const directionVectorByAxisId: Record<AxisId, ThreeVector3> = {
  [AxisId.X]: new ThreeVector3(1, 0, 0),
  [AxisId['-X']]: new ThreeVector3(-1, 0, 0),
  [AxisId.Y]: new ThreeVector3(0, 1, 0),
  [AxisId['-Y']]: new ThreeVector3(0, -1, 0),
  [AxisId.Z]: new ThreeVector3(0, 0, 1),
  [AxisId['-Z']]: new ThreeVector3(0, 0, -1),
} as const

const flippedAxisIdByAxisId = {
  [AxisId.X]: AxisId['-X'],
  [AxisId['-X']]: AxisId.X,
  [AxisId.Y]: AxisId['-Y'],
  [AxisId['-Y']]: AxisId.Y,
  [AxisId.Z]: AxisId['-Z'],
  [AxisId['-Z']]: AxisId.Z,
} as const

const axisIds = Object.keys(directionByAxisId) as Array<AxisId>

export function axisIdToDirection(axisId: AxisId) {
  return directionByAxisId[axisId]
}

export function axisIdToDirectionVector(axisId: AxisId): ThreeVector3 {
  return directionVectorByAxisId[axisId]
}

export function flipAxisId(axisId: AxisId) {
  return flippedAxisIdByAxisId[axisId]
}

export function directionToAxisId(direction: Direction): AxisId | undefined {
  return axisIds.find((axisId) => {
    const axisDirection = directionByAxisId[axisId]
    return (
      direction[0] === axisDirection[0] &&
      direction[1] === axisDirection[1] &&
      direction[2] === axisDirection[2]
    )
  })
}

export function isStandardDirection(direction: Direction): boolean {
  return isStandardAxisVector(new ThreeVector3(...direction))
}

export function isStandardAxisVector(vector: ThreeVector3): boolean {
  if (vector.length() !== 1) return false
  return Math.abs(vector.x) === 1 || Math.abs(vector.y) === 1 || Math.abs(vector.z) === 1
}

export type AxisValues = Record<AxisId.X | AxisId.Y | AxisId.Z, number>

export function axisValuesToVector(axisValues: AxisValues): [number, number, number] {
  const x = AxisId.X in axisValues ? axisValues[AxisId.X] : -axisValues[AxisId['-X']]
  const y = AxisId.Y in axisValues ? axisValues[AxisId.Y] : -axisValues[AxisId['-Y']]
  const z = AxisId.Z in axisValues ? axisValues[AxisId.Z] : -axisValues[AxisId['-Z']]
  return [x, y, z]
}

export function mapRange(value: number, x1: number, y1: number, x2: number, y2: number): number {
  return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2
}
