import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { WallFrameType } from './types'
import { wallFrameVariants } from './variants'

const getDefaultVariantId = (): keyof typeof wallFrameVariants => 'WallFrame_MacrocarpaPlaster'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
// XY panel → XZ wall: X stays in X, Y becomes Z (height up), Z becomes Y (depth into wall)
const xyToXZTransform = changeOfBasisTransform(baseBasis, [X_AXIS, Z_AXIS, Y_AXIS])
// XY panel → YZ wall: X becomes Y (width along Y), Y becomes Z (height up), Z becomes X (depth into wall)
const xyToYZTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, Z_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class WallFrameSpec extends BasePartSpec<WallFrameType> {
  variantId: keyof typeof wallFrameVariants
  widthInGrids: number
  heightInGrids: number
  materialId: string

  constructor(
    widthInGrids: number,
    heightInGrids: number,
    variantId?: keyof typeof wallFrameVariants,
    materialId = 'MacrocarpaPlaster',
  ) {
    super('wall-frame')
    this.variantId = variantId ?? getDefaultVariantId()
    this.widthInGrids = widthInGrids
    this.heightInGrids = heightInGrids
    this.materialId = materialId
  }

  id(): string {
    return `WallFrame_${this.widthInGrids}x${this.heightInGrids}gu_${this.variantId}_${this.materialId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.widthInGrids === other.widthInGrids &&
      this.heightInGrids === other.heightInGrids &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    const wDiff = other.widthInGrids - this.widthInGrids
    if (wDiff !== 0) return wDiff
    return other.heightInGrids - this.heightInGrids
  }
}

export type WallFrameSpecSerialized = {
  type: WallFrameType
  variantId: keyof typeof wallFrameVariants
  widthInGrids: number
  heightInGrids: number
  materialId: string
}

function serializeSpec(instance: WallFrameSpec): WallFrameSpecSerialized {
  const { variantId, widthInGrids, heightInGrids, materialId } = instance
  return { type: 'wall-frame', variantId, widthInGrids, heightInGrids, materialId }
}

function deserializeSpec(object: WallFrameSpecSerialized): WallFrameSpec {
  const { variantId, widthInGrids, heightInGrids, materialId } = object
  return new WallFrameSpec(widthInGrids, heightInGrids, variantId, materialId)
}

export class WallFrame extends BasePartCreator<WallFrameSpec> {
  static create(options: WallFrameCreateOptions) {
    const { id, variantId, widthInGrids, heightInGrids, materialId } = options
    const spec = new WallFrameSpec(widthInGrids, heightInGrids, variantId, materialId)
    return new WallFrame(spec, id)
  }

  static XZ(options: WallFrameXZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseRange(x)
    const safeY = parseNumber(y)
    const safeZ = parseRange(z)

    let member = WallFrame.create({
      id,
      variantId,
      widthInGrids: Math.abs(safeX[0] - safeX[1]),
      heightInGrids: Math.abs(safeZ[0] - safeZ[1]),
      materialId,
    }).applyTransform(xyToXZTransform)

    if (safeX[0] > safeX[1]) {
      member = member.applyTransform(mirrorXTransform)
    }
    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }

    return member.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }

  static YZ(options: WallFrameYZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = parseNumber(x)
    const safeY = parseRange(y)
    const safeZ = parseRange(z)

    let member = WallFrame.create({
      id,
      variantId,
      widthInGrids: Math.abs(safeY[0] - safeY[1]),
      heightInGrids: Math.abs(safeZ[0] - safeZ[1]),
      materialId,
    }).applyTransform(xyToYZTransform)

    if (safeY[0] > safeY[1]) {
      member = member.applyTransform(mirrorYTransform)
    }
    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }

    return member.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ[0] * gridUnit])
  }
}

interface WallFrameCreateOptions {
  id?: string
  variantId?: keyof typeof wallFrameVariants
  widthInGrids: number
  heightInGrids: number
  materialId?: string
}

interface WallFrameXZOptions {
  id?: string
  variantId?: keyof typeof wallFrameVariants
  x: [number, number]
  y: number
  z: [number, number]
  materialId?: string
}

interface WallFrameYZOptions {
  id?: string
  variantId?: keyof typeof wallFrameVariants
  x: number
  y: [number, number]
  z: [number, number]
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = wallFrameVariants[variantId]
  if (variant == null) throw new Error(`Unknown wall-frame variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'wall-frame',
  serializeSpec,
  deserializeSpec,
  Creator: WallFrame,
})

function parseRange(range: [number, number]): [number, number] {
  return [range[0], range[1]]
}

function parseNumber(val: number): number {
  return val
}
