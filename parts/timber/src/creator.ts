import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { TimberType } from './types'
import { timberVariants } from './variants'

const getDefaultVariantId = (): keyof typeof timberVariants => 'Timber_120x120_SG8'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
const xToYTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, X_AXIS, Z_AXIS])
const xToZTransform = changeOfBasisTransform(baseBasis, [Z_AXIS, Y_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class TimberSpec extends BasePartSpec<TimberType> {
  variantId: keyof typeof timberVariants
  lengthInGrids: number

  constructor(lengthInGrids: number, variantId?: keyof typeof timberVariants) {
    super('timber')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
  }

  id(): string {
    return `Timber_Length${this.lengthInGrids}gu_${this.variantId}`
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

export type TimberSpecSerialized = {
  type: TimberType
  variantId: keyof typeof timberVariants
  lengthInGrids: number
}
function serializeSpec(instance: TimberSpec): TimberSpecSerialized {
  const { variantId, lengthInGrids } = instance
  return { type: 'timber', variantId, lengthInGrids }
}
function deserializeSpec(object: TimberSpecSerialized): TimberSpec {
  const { variantId, lengthInGrids } = object
  return new TimberSpec(lengthInGrids, variantId)
}

export class Timber extends BasePartCreator<TimberSpec> {
  static create(options: TimberOptions) {
    const { variantId, lengthInGrids, id } = options
    const spec = new TimberSpec(lengthInGrids, variantId)
    return new Timber(spec, id)
  }

  static X(options: TimberXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseRange(x)
    const safeY = parseNumber(y)
    const safeZ = parseNumber(z)

    let member = Timber.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeX[0] - safeX[1]),
    })

    if (safeX[0] > safeX[1]) {
      member = member.applyTransform(mirrorXTransform)
    }

    return member.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  static Y(options: TimberYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x)
    const safeY = parseRange(y)
    const safeZ = parseNumber(z)

    let member = Timber.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeY[0] - safeY[1]),
    }).applyTransform(xToYTransform)

    if (safeY[0] > safeY[1]) {
      member = member.applyTransform(mirrorYTransform)
    }

    return member.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }

  static Z(options: TimberZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x)
    const safeY = parseNumber(y)
    const safeZ = parseRange(z)

    let member = Timber.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeZ[0] - safeZ[1]),
    }).applyTransform(xToZTransform)

    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }

    return member.translate([safeX * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }
}

interface TimberSpecOptions {
  variantId: keyof typeof timberVariants
  lengthInGrids: number
}

interface BaseCreatorOptions {
  id?: string
}

interface TimberOptions extends BaseCreatorOptions, TimberSpecOptions {}

interface TimberXOptions extends BaseCreatorOptions {
  variantId?: keyof typeof timberVariants
  x: [number, number]
  y: number
  z: number
}

interface TimberYOptions extends BaseCreatorOptions {
  variantId?: keyof typeof timberVariants
  x: number
  y: [number, number]
  z: number
}

interface TimberZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof timberVariants
  x: number
  y: number
  z: [number, number]
}

function getGridLengthInMeters(variantId: string): number {
  const variant = timberVariants[variantId]
  if (variant == null) throw new Error(`Unknown timber variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'timber',
  serializeSpec,
  deserializeSpec,
  Creator: Timber,
})

function parseRange(range: [number, number]): [number, number] {
  return [range[0], range[1]]
}

function parseNumber(val: number): number {
  return val
}
