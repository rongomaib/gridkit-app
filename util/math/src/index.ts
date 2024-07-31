import { Matrix4, Vector3 } from 'three'

export type Point2 = readonly [number, number]
export type Point3 = readonly [number, number, number]

// column-major 4x4 transformation matrix
export type TransformMatrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export enum AxisId {
  X = 'X',
  '-X' = '-X',
  Y = 'Y',
  '-Y' = '-Y',
  Z = 'Z',
  '-Z' = '-Z',
}

const directionByAxisId: Record<AxisId, Point3> = {
  [AxisId.X]: [1, 0, 0],
  [AxisId['-X']]: [-1, 0, 0],
  [AxisId.Y]: [0, 1, 0],
  [AxisId['-Y']]: [0, -1, 0],
  [AxisId.Z]: [0, 0, 1],
  [AxisId['-Z']]: [0, 0, -1],
} as const

const directionVectorByAxisId: Record<AxisId, Vector3> = {
  [AxisId.X]: new Vector3(1, 0, 0),
  [AxisId['-X']]: new Vector3(-1, 0, 0),
  [AxisId.Y]: new Vector3(0, 1, 0),
  [AxisId['-Y']]: new Vector3(0, -1, 0),
  [AxisId.Z]: new Vector3(0, 0, 1),
  [AxisId['-Z']]: new Vector3(0, 0, -1),
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

export function axisIdToDirectionVector(axisId: AxisId): Vector3 {
  return directionVectorByAxisId[axisId]
}

export function flipAxisId(axisId: AxisId) {
  return flippedAxisIdByAxisId[axisId]
}

export function directionToAxisId(direction: Point3): AxisId | undefined {
  return axisIds.find((axisId) => {
    const axisDirection = directionByAxisId[axisId]
    return pointEquals(direction, axisDirection)
  })
}

export function floatEquals(a: number, b: number, epsilon = Number.EPSILON * 100): boolean {
  return Math.abs(a - b) < epsilon
}

export function pointEquals(a: Point3, b: Point3, epsilon = Number.EPSILON * 100): boolean {
  return (
    floatEquals(a[0], b[0], epsilon) &&
    floatEquals(a[1], b[1], epsilon) &&
    floatEquals(a[2], b[2], epsilon)
  )
}

export function isStandardDirection(direction: Point3): boolean {
  return isStandardAxisVector(new Vector3(...direction))
}

export function isStandardAxisVector(vector: Vector3): boolean {
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

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

export function degToRad(degrees: number) {
  return degrees * DEG2RAD
}

export function radToDeg(radians: number) {
  return radians * RAD2DEG
}

// https://math.stackexchange.com/a/628075
export type Basis = readonly [Point3, Point3, Point3]
export function changeOfBasisTransform(a: Basis, b: Basis): TransformMatrix {
  const A = new Matrix4().makeBasis(
    new Vector3(...a[0]),
    new Vector3(...a[1]),
    new Vector3(...a[2]),
  )
  const B = new Matrix4().makeBasis(
    new Vector3(...b[0]),
    new Vector3(...b[1]),
    new Vector3(...b[2]),
  )
  const AB = new Matrix4().multiplyMatrices(A.invert(), B)
  return AB.toArray()
}

export function mirrorTransform(axis: 'x' | 'y' | 'z'): TransformMatrix {
  switch (axis) {
    case 'x':
      return new Matrix4().makeScale(-1, 1, 1).toArray()
    case 'y':
      return new Matrix4().makeScale(1, -1, 1).toArray()
    case 'z':
      return new Matrix4().makeScale(1, 1, -1).toArray()
  }
}
