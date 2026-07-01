import {
  type BaseCreatorOptions,
  BasePartCreator,
  BasePartSpec,
  mirrorXTransform,
  mirrorYTransform,
  mirrorZTransform,
  parseNumber,
  parseRange,
  registerSerializer,
  xToYTransform,
  xToZTransform,
} from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { Beam120Type } from './types'
import { beam120Variants } from './variants'

const getDefaultVariantId = (): keyof typeof beam120Variants => 'Beam120_Macrocarpa'

export class Beam120Spec extends BasePartSpec<Beam120Type> {
  variantId: keyof typeof beam120Variants
  lengthInGrids: number
  materialId: string

  constructor(
    lengthInGrids: number,
    variantId?: keyof typeof beam120Variants,
    materialId = 'Macrocarpa',
  ) {
    super('beam120')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.materialId = materialId
  }

  id(): string {
    return `Beam120_Length${this.lengthInGrids}gu_${this.variantId}_${this.materialId}`
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

export type Beam120SpecSerialized = {
  type: Beam120Type
  variantId: keyof typeof beam120Variants
  lengthInGrids: number
  materialId: string
}
function serializeSpec(instance: Beam120Spec): Beam120SpecSerialized {
  const { variantId, lengthInGrids, materialId } = instance
  return { type: 'beam120', variantId, lengthInGrids, materialId }
}
function deserializeSpec(object: Beam120SpecSerialized): Beam120Spec {
  const { variantId, lengthInGrids, materialId } = object
  return new Beam120Spec(lengthInGrids, variantId, materialId as string | undefined)
}

export class Beam120 extends BasePartCreator<Beam120Spec> {
  static create(options: Beam120Options) {
    const { variantId, lengthInGrids, id, materialId } = options
    const spec = new Beam120Spec(lengthInGrids, variantId, materialId)
    return new Beam120(spec, id)
  }

  static X(options: Beam120XOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseRange(x)
    const safeY = parseNumber(y)
    const safeZ = parseNumber(z)

    let member = Beam120.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeX[0] - safeX[1]),
      materialId,
    })

    if (safeX[0] > safeX[1]) {
      member = member.applyTransform(mirrorXTransform)
    }

    return member.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  static Y(options: Beam120YOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x)
    const safeY = parseRange(y)
    const safeZ = parseNumber(z)

    let member = Beam120.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeY[0] - safeY[1]),
      materialId,
    }).applyTransform(xToYTransform)

    if (safeY[0] > safeY[1]) {
      member = member.applyTransform(mirrorYTransform)
    }

    return member.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }

  static Z(options: Beam120ZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x)
    const safeY = parseNumber(y)
    const safeZ = parseRange(z)

    let member = Beam120.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeZ[0] - safeZ[1]),
      materialId,
    }).applyTransform(xToZTransform)

    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }

    return member.translate([safeX * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }
}

interface Beam120SpecOptions {
  variantId: keyof typeof beam120Variants
  lengthInGrids: number
  materialId?: string
}

interface Beam120Options extends BaseCreatorOptions, Beam120SpecOptions {}

interface Beam120XOptions extends BaseCreatorOptions {
  variantId?: keyof typeof beam120Variants
  x: [number, number]
  y: number
  z: number
  materialId?: string
}

interface Beam120YOptions extends BaseCreatorOptions {
  variantId?: keyof typeof beam120Variants
  x: number
  y: [number, number]
  z: number
  materialId?: string
}

interface Beam120ZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof beam120Variants
  x: number
  y: number
  z: [number, number]
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = beam120Variants[variantId]
  if (variant == null) throw new Error(`Unknown beam120 variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'beam120',
  serializeSpec,
  deserializeSpec,
  Creator: Beam120,
})
