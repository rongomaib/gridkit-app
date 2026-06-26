import { changeOfBasisTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { GablePanelType } from './types'
import { gablePanelVariants } from './variants'

const getDefaultVariantId = (): keyof typeof gablePanelVariants => 'GablePanel_MacrocarpaPlaster'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
// Canonical: right-triangle in XY, depth in Z.
// After this transform: X→Y (base along wall), Y→Z (height up), Z→X (depth into wall)
const xyToYZTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, Z_AXIS, X_AXIS])

export class GablePanelSpec extends BasePartSpec<GablePanelType> {
  variantId: keyof typeof gablePanelVariants
  baseInGrids: number
  heightInGrids: number
  materialId: string

  constructor(
    baseInGrids: number,
    heightInGrids: number,
    variantId?: keyof typeof gablePanelVariants,
    materialId = 'MacrocarpaPlaster',
  ) {
    super('gable-panel')
    this.variantId = variantId ?? getDefaultVariantId()
    this.baseInGrids = baseInGrids
    this.heightInGrids = heightInGrids
    this.materialId = materialId
  }

  id(): string {
    return `GablePanel_${this.baseInGrids}x${this.heightInGrids}gu_${this.variantId}_${this.materialId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.baseInGrids === other.baseInGrids &&
      this.heightInGrids === other.heightInGrids &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    const bDiff = other.baseInGrids - this.baseInGrids
    if (bDiff !== 0) return bDiff
    return other.heightInGrids - this.heightInGrids
  }
}

export type GablePanelSpecSerialized = {
  type: GablePanelType
  variantId: keyof typeof gablePanelVariants
  baseInGrids: number
  heightInGrids: number
  materialId: string
}

function serializeSpec(instance: GablePanelSpec): GablePanelSpecSerialized {
  const { variantId, baseInGrids, heightInGrids, materialId } = instance
  return { type: 'gable-panel', variantId, baseInGrids, heightInGrids, materialId }
}

function deserializeSpec(object: GablePanelSpecSerialized): GablePanelSpec {
  const { variantId, baseInGrids, heightInGrids, materialId } = object
  return new GablePanelSpec(baseInGrids, heightInGrids, variantId, materialId)
}

export class GablePanel extends BasePartCreator<GablePanelSpec> {
  static create(options: GablePanelCreateOptions) {
    const { id, variantId, baseInGrids, heightInGrids, materialId } = options
    const spec = new GablePanelSpec(baseInGrids, heightInGrids, variantId, materialId)
    return new GablePanel(spec, id)
  }

  // Place a right-triangle gable panel on a side wall (YZ plane).
  // y[0] is the TALL corner; height tapers to zero at y[1].
  static YZ(options: GablePanelYZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, heightInGrids, materialId } = options

    const gridUnit = getGridLengthInMeters(variantId)

    const baseInGrids = Math.abs(y[1] - y[0])

    const member = GablePanel.create({
      id,
      variantId,
      baseInGrids,
      heightInGrids,
      materialId,
    }).applyTransform(xyToYZTransform)

    return member.translate([x * gridUnit, y[0] * gridUnit, z * gridUnit])
  }
}

interface GablePanelCreateOptions {
  id?: string
  variantId?: keyof typeof gablePanelVariants
  baseInGrids: number
  heightInGrids: number
  materialId?: string
}

interface GablePanelYZOptions {
  id?: string
  variantId?: keyof typeof gablePanelVariants
  x: number
  y: [number, number]
  z: number
  heightInGrids: number
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = gablePanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown gable-panel variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'gable-panel',
  serializeSpec,
  deserializeSpec,
  Creator: GablePanel,
})
