import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { GridBeamType } from './types'
import { gridBeamVariants } from './variants'

const getDefaultVariantId = (): keyof typeof gridBeamVariants =>
  'Grid40mm_Hole8mm_MaterialDouglasFir'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
const xToYTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, X_AXIS, Z_AXIS])
const xToZTransform = changeOfBasisTransform(baseBasis, [Z_AXIS, Y_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class GridBeamSpec extends BasePartSpec<GridBeamType> {
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number

  constructor(lengthInGrids: number, variantId?: keyof typeof gridBeamVariants) {
    super('gridbeam')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
  }

  id(): string {
    return `GridBeam_Length${this.lengthInGrids}gu_${this.variantId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.lengthInGrids === other.lengthInGrids
    )
  }

  compare(other: this): number {
    return other.lengthInGrids - this.lengthInGrids
  }
}

export type GridBeamSpecSerialized = {
  type: GridBeamType
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number
}
function serializeSpec(instance: GridBeamSpec): GridBeamSpecSerialized {
  const { variantId, lengthInGrids } = instance
  return { type: 'gridbeam', variantId, lengthInGrids }
}
function deserializeSpec(object: GridBeamSpecSerialized): GridBeamSpec {
  const { variantId, lengthInGrids } = object
  return new GridBeamSpec(lengthInGrids, variantId)
}

export class GridBeam extends BasePartCreator<GridBeamSpec> {
  static create(options: GridBeamOptions) {
    const { variantId, lengthInGrids, id } = options
    const spec = new GridBeamSpec(lengthInGrids, variantId)
    return new GridBeam(spec, id)
  }

  static X(options: GridBeamXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseRange(x, 0)
    const safeY = parseNumber(y, 0)
    const safeZ = parseNumber(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeX[0] - safeX[1]),
    })

    if (safeX[0] > safeX[1]) {
      beam = beam.applyTransform(mirrorXTransform)
    }

    return beam.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  static Y(options: GridBeamYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x, 0)
    const safeY = parseRange(y, 0)
    const safeZ = parseNumber(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeY[0] - safeY[1]),
    }).applyTransform(xToYTransform)

    if (safeY[0] > safeY[1]) {
      beam = beam.applyTransform(mirrorYTransform)
    }

    return beam.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }

  static Z(options: GridBeamZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x, 0)
    const safeY = parseNumber(y, 0)
    const safeZ = parseRange(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeZ[0] - safeZ[1]),
    }).applyTransform(xToZTransform)

    if (safeZ[0] > safeZ[1]) {
      beam = beam.applyTransform(mirrorZTransform)
    }

    return beam.translate([safeX * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }
}

interface GridBeamSpecOptions {
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number
}

interface BaseCreatorOptions {
  id?: string
}

interface GridBeamOptions extends BaseCreatorOptions, GridBeamSpecOptions {}

interface GridBeamXOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: [number, number]
  y: number
  z: number
}

interface GridBeamYOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: [number, number]
  z: number
}

interface GridBeamZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: number
  z: [number, number]
}

function getGridLengthInMeters(variantId: string): number {
  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }
  const { gridLength } = variant
  return convert(gridLength, meter).value
}

registerSerializer({
  type: 'gridbeam',
  serializeSpec,
  deserializeSpec,
  Creator: GridBeam,
})

function parseRange(range: any, defaultValue = 0): [number, number] {
  if (!Array.isArray(range)) {
    const val = typeof range === 'number' && !Number.isNaN(range) ? range : defaultValue
    return [0, val]
  }
  const r0 = typeof range[0] === 'number' && !Number.isNaN(range[0]) ? range[0] : defaultValue
  const r1 =
    typeof range[1] === 'number' && !Number.isNaN(range[1])
      ? range[1]
      : range[0] !== undefined && typeof range[0] === 'number' && !Number.isNaN(range[0])
        ? range[0] + 1
        : defaultValue + 1
  return [r0, r1]
}

function parseNumber(val: any, defaultValue = 0): number {
  return typeof val === 'number' && !Number.isNaN(val) ? val : defaultValue
}
