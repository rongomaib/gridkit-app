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
import type { GridBeamType } from './types'
import { gridBeamVariants } from './variants'

const getDefaultVariantId = (): keyof typeof gridBeamVariants =>
  'Grid40mm_Hole8mm_MaterialDouglasFir'

export class GridBeamSpec extends BasePartSpec<GridBeamType> {
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number
  materialId: string

  constructor(
    lengthInGrids: number,
    variantId?: keyof typeof gridBeamVariants,
    materialId = 'S275',
  ) {
    super('gridbeam')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.materialId = materialId
  }

  id(): string {
    return `GridBeam_Length${this.lengthInGrids}gu_${this.variantId}_${this.materialId}`
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

export type GridBeamSpecSerialized = {
  type: GridBeamType
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number
  materialId: string
}
function serializeSpec(instance: GridBeamSpec): GridBeamSpecSerialized {
  const { variantId, lengthInGrids, materialId } = instance
  return { type: 'gridbeam', variantId, lengthInGrids, materialId }
}
function deserializeSpec(object: GridBeamSpecSerialized): GridBeamSpec {
  const { variantId, lengthInGrids, materialId } = object
  return new GridBeamSpec(lengthInGrids, variantId, materialId as string | undefined)
}

export class GridBeam extends BasePartCreator<GridBeamSpec> {
  static create(options: GridBeamOptions) {
    const { variantId, lengthInGrids, id, materialId } = options
    const spec = new GridBeamSpec(lengthInGrids, variantId, materialId)
    return new GridBeam(spec, id)
  }

  static X(options: GridBeamXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseRange(x, 0)
    const safeY = parseNumber(y, 0)
    const safeZ = parseNumber(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeX[0] - safeX[1]),
      materialId,
    })

    if (safeX[0] > safeX[1]) {
      beam = beam.applyTransform(mirrorXTransform)
    }

    return beam.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  static Y(options: GridBeamYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x, 0)
    const safeY = parseRange(y, 0)
    const safeZ = parseNumber(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeY[0] - safeY[1]),
      materialId,
    }).applyTransform(xToYTransform)

    if (safeY[0] > safeY[1]) {
      beam = beam.applyTransform(mirrorYTransform)
    }

    return beam.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }

  static Z(options: GridBeamZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x, 0)
    const safeY = parseNumber(y, 0)
    const safeZ = parseRange(z, 0)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeZ[0] - safeZ[1]),
      materialId,
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
  materialId?: string
}

interface GridBeamOptions extends BaseCreatorOptions, GridBeamSpecOptions {}

interface GridBeamXOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: [number, number]
  y: number
  z: number
  materialId?: string
}

interface GridBeamYOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: [number, number]
  z: number
  materialId?: string
}

interface GridBeamZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: number
  z: [number, number]
  materialId?: string
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
