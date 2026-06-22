import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { PanelBraceType } from './types'
import { panelBraceVariants } from './variants'

const getDefaultVariantId = (): keyof typeof panelBraceVariants => 'Ply_120x800'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
// panel-brace spans X or Y; height is in Z; depth is the thin dimension (Y or X respectively)
// For X-spanning: rotate so height (originally Y) becomes Z, depth (originally Z) becomes Y
const xSpanTransform = changeOfBasisTransform(baseBasis, [X_AXIS, Z_AXIS, Y_AXIS])
// For Y-spanning: rotate so the panel spans Y, height in Z, depth in X
const ySpanTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, Z_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')

export class PanelBraceSpec extends BasePartSpec<PanelBraceType> {
  variantId: keyof typeof panelBraceVariants
  lengthInGrids: number
  heightInGrids: number
  depthInGrids: number

  constructor(
    lengthInGrids: number,
    variantId?: keyof typeof panelBraceVariants,
    heightInGrids?: number,
    depthInGrids?: number,
  ) {
    super('panel-brace')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.heightInGrids = heightInGrids ?? 20
    this.depthInGrids = depthInGrids ?? 3
  }

  id(): string {
    return `PanelBrace_${this.lengthInGrids}x${this.heightInGrids}x${this.depthInGrids}gu_${this.variantId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.lengthInGrids === other.lengthInGrids &&
      this.heightInGrids === other.heightInGrids &&
      this.depthInGrids === other.depthInGrids
    )
  }

  compare(other: this): number {
    return other.lengthInGrids - this.lengthInGrids
  }
}

export type PanelBraceSpecSerialized = {
  type: PanelBraceType
  variantId: keyof typeof panelBraceVariants
  lengthInGrids: number
  heightInGrids: number
  depthInGrids: number
}
function serializeSpec(instance: PanelBraceSpec): PanelBraceSpecSerialized {
  const { variantId, lengthInGrids, heightInGrids, depthInGrids } = instance
  return { type: 'panel-brace', variantId, lengthInGrids, heightInGrids, depthInGrids }
}
function deserializeSpec(object: PanelBraceSpecSerialized): PanelBraceSpec {
  const { variantId, lengthInGrids, heightInGrids, depthInGrids } = object
  return new PanelBraceSpec(lengthInGrids, variantId, heightInGrids, depthInGrids)
}

export class PanelBrace extends BasePartCreator<PanelBraceSpec> {
  static create(options: PanelBraceOptions) {
    const { variantId, lengthInGrids, heightInGrids, depthInGrids, id } = options
    const spec = new PanelBraceSpec(lengthInGrids, variantId, heightInGrids, depthInGrids)
    return new PanelBrace(spec, id)
  }

  // Horizontal panel spanning X axis; height rises in Z; depth in Y.
  // z is the bottom-of-panel grid position.
  static X(options: PanelBraceXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), heightInGrids, depthInGrids } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = [x[0], x[1]] as [number, number]
    const safeY = y
    const safeZ = z

    let panel = PanelBrace.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeX[0] - safeX[1]),
      heightInGrids,
      depthInGrids,
    }).applyTransform(xSpanTransform)

    if (safeX[0] > safeX[1]) {
      panel = panel.applyTransform(mirrorXTransform)
    }

    return panel.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }

  // Horizontal panel spanning Y axis; height rises in Z; depth in X.
  // z is the bottom-of-panel grid position.
  static Y(options: PanelBraceYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), heightInGrids, depthInGrids } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const safeX = x
    const safeY = [y[0], y[1]] as [number, number]
    const safeZ = z

    let panel = PanelBrace.create({
      id,
      variantId,
      lengthInGrids: Math.abs(safeY[0] - safeY[1]),
      heightInGrids,
      depthInGrids,
    }).applyTransform(ySpanTransform)

    if (safeY[0] > safeY[1]) {
      panel = panel.applyTransform(mirrorYTransform)
    }

    return panel.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }
}

interface PanelBraceSpecOptions {
  variantId: keyof typeof panelBraceVariants
  lengthInGrids: number
  heightInGrids?: number
  depthInGrids?: number
}

interface BaseCreatorOptions {
  id?: string
}

interface PanelBraceOptions extends BaseCreatorOptions, PanelBraceSpecOptions {}

interface PanelBraceXOptions extends BaseCreatorOptions {
  variantId?: keyof typeof panelBraceVariants
  x: [number, number]
  y: number
  z: number
  heightInGrids?: number
  depthInGrids?: number
}

interface PanelBraceYOptions extends BaseCreatorOptions {
  variantId?: keyof typeof panelBraceVariants
  x: number
  y: [number, number]
  z: number
  heightInGrids?: number
  depthInGrids?: number
}

function getGridLengthInMeters(variantId: string): number {
  const variant = panelBraceVariants[variantId]
  if (variant == null) throw new Error(`Unknown panel-brace variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'panel-brace',
  serializeSpec,
  deserializeSpec,
  Creator: PanelBrace,
})
