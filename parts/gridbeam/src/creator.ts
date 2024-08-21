import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { GridBeamType } from './types'
import { gridBeamVariants } from './variants'

const getDefaultVariantId = () => '40mm:8mm:douglas-fir'

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

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(x[0] - x[1]),
    })

    if (x[0] > x[1]) {
      beam = beam.applyTransform(mirrorXTransform)
    }

    return beam.translate([x[0] * gridUnit, y * gridUnit, z * gridUnit])
  }

  static Y(options: GridBeamYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(y[0] - y[1]),
    }).applyTransform(xToYTransform)

    if (y[0] > y[1]) {
      beam = beam.applyTransform(mirrorYTransform)
    }

    return beam.translate([x * gridUnit, y[0] * gridUnit, z * gridUnit])
  }

  static Z(options: GridBeamZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)

    let beam = GridBeam.create({
      id,
      variantId,
      lengthInGrids: Math.abs(z[0] - z[1]),
    }).applyTransform(xToZTransform)

    if (z[0] > z[1]) {
      beam = beam.applyTransform(mirrorZTransform)
    }

    return beam.translate([x * gridUnit, y * gridUnit, z[0] * gridUnit])
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
