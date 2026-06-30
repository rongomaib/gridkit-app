import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { SteelGusset6mmType } from './types'
import { steelGusset6mmVariants } from './variants'

const getDefaultVariantId = (): keyof typeof steelGusset6mmVariants => '4_2_Steel_Gusset_Plate__6mm__80x160_Default'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
const xToYTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, X_AXIS, Z_AXIS])
const xToZTransform = changeOfBasisTransform(baseBasis, [Z_AXIS, Y_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class SteelGusset6mmSpec extends BasePartSpec<SteelGusset6mmType> {
  variantId: keyof typeof steelGusset6mmVariants
  lengthInGrids: number
  materialId: string

  constructor(lengthInGrids: number, variantId?: keyof typeof steelGusset6mmVariants, materialId = 'Default') {
    super('steel-gusset-6mm')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.materialId = materialId
  }

  id(): string {
    return `SteelGusset6mm_Length${this.lengthInGrids}gu_${this.variantId}_${this.materialId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.lengthInGrids === other.lengthInGrids &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    return other.lengthInGrids - this.lengthInGrids
  }
}

export type SteelGusset6mmSpecSerialized = {
  type: SteelGusset6mmType
  variantId: keyof typeof steelGusset6mmVariants
  lengthInGrids: number
  materialId: string
}

function serializeSpec(instance: SteelGusset6mmSpec): SteelGusset6mmSpecSerialized {
  const { variantId, lengthInGrids, materialId } = instance
  return { type: 'steel-gusset-6mm', variantId, lengthInGrids, materialId }
}

function deserializeSpec(object: SteelGusset6mmSpecSerialized): SteelGusset6mmSpec {
  const { variantId, lengthInGrids, materialId } = object
  return new SteelGusset6mmSpec(lengthInGrids, variantId, materialId as string | undefined)
}

export class SteelGusset6mm extends BasePartCreator<SteelGusset6mmSpec> {
  static create(options: SteelGusset6mmOptions) {
    const { variantId, lengthInGrids, id, materialId } = options
    const spec = new SteelGusset6mmSpec(lengthInGrids, variantId, materialId)
    return new SteelGusset6mm(spec, id)
  }

  static X(options: SteelGusset6mmXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseRange(x)
    const safeY = parseNumber(y)
    const safeZ = parseNumber(z)
    let member = SteelGusset6mm.create({ id, variantId, lengthInGrids: Math.abs(safeX[0] - safeX[1]), materialId })
    if (safeX[0] > safeX[1]) {
      member = member.applyTransform(mirrorXTransform)
    }
    return member.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  static Y(options: SteelGusset6mmYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseNumber(x)
    const safeY = parseRange(y)
    const safeZ = parseNumber(z)
    let member = SteelGusset6mm.create({ id, variantId, lengthInGrids: Math.abs(safeY[0] - safeY[1]), materialId }).applyTransform(xToYTransform)
    if (safeY[0] > safeY[1]) {
      member = member.applyTransform(mirrorYTransform)
    }
    return member.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }

  static Z(options: SteelGusset6mmZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseNumber(x)
    const safeY = parseNumber(y)
    const safeZ = parseRange(z)
    let member = SteelGusset6mm.create({ id, variantId, lengthInGrids: Math.abs(safeZ[0] - safeZ[1]), materialId }).applyTransform(xToZTransform)
    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }
    return member.translate([safeX * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }
}

interface SteelGusset6mmSpecOptions {
  variantId: keyof typeof steelGusset6mmVariants
  lengthInGrids: number
  materialId?: string
}

interface BaseCreatorOptions {
  id?: string
}

interface SteelGusset6mmOptions extends BaseCreatorOptions, SteelGusset6mmSpecOptions {}

interface SteelGusset6mmXOptions extends BaseCreatorOptions {
  variantId?: keyof typeof steelGusset6mmVariants
  x: [number, number]
  y: number
  z: number
  materialId?: string
}

interface SteelGusset6mmYOptions extends BaseCreatorOptions {
  variantId?: keyof typeof steelGusset6mmVariants
  x: number
  y: [number, number]
  z: number
  materialId?: string
}

interface SteelGusset6mmZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof steelGusset6mmVariants
  x: number
  y: number
  z: [number, number]
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = steelGusset6mmVariants[variantId]
  if (variant == null) throw new Error(`Unknown steel-gusset-6mm variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'steel-gusset-6mm',
  serializeSpec,
  deserializeSpec,
  Creator: SteelGusset6mm,
})

function parseRange(range: [number, number]): [number, number] {
  return [range[0], range[1]]
}

function parseNumber(val: number): number {
  return val
}
