import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type {
  GridPanelFit,
  GridPanelHoleVariant,
  GridPanelHoles,
  GridPanelSpecHoleVariant,
  GridPanelType,
  GridPanelVariant,
} from './types'
import { gridPanelVariants } from './variants'

const getDefaultVariantId = (): keyof typeof gridPanelVariants =>
  'Grid40mm_Hole8mm_Thickness12mm_MaterialPlywood'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
const xyToYZTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, Z_AXIS, X_AXIS])
const xyToXZTransform = changeOfBasisTransform(baseBasis, [X_AXIS, Z_AXIS, Y_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class GridPanelSpec extends BasePartSpec<GridPanelType> {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  holes: GridPanelHoles
  holeVariant: GridPanelSpecHoleVariant

  constructor(
    sizeInGrids: [number, number],
    variantId?: keyof typeof gridPanelVariants,
    holes: GridPanelHoles = true,
    holeVariant: GridPanelSpecHoleVariant = 'through',
  ) {
    super('gridpanel')
    this.variantId = variantId ?? getDefaultVariantId()
    this.sizeInGrids = sizeInGrids
    this.holes = holes
    this.holeVariant = holeVariant
  }

  id(): string {
    return `GridPanel_Size${this.sizeInGrids[0]}x${this.sizeInGrids[1]}gu_${this.variantId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.sizeInGrids[0] === other.sizeInGrids[0] &&
      this.sizeInGrids[1] === other.sizeInGrids[1] &&
      holesEquals(this.holes, other.holes) &&
      this.holeVariant === other.holeVariant
    )
  }

  compare(other: this): number {
    return -compareXYs(this.sizeInGrids, other.sizeInGrids)
  }

  normalize(): this {
    const { variantId } = this
    let { sizeInGrids, holes, holeVariant } = this

    // "rotate" panel so main length is larger side
    if (sizeInGrids[1] > sizeInGrids[0]) {
      sizeInGrids = [sizeInGrids[1], sizeInGrids[0]]
      holes = Array.isArray(holes) ? holes.map((hole) => [hole[1], hole[0]]) : holes
    }

    // sort holes by sorting
    if (Array.isArray(holes)) {
      holes = holes.slice().sort(compareXYs)
    }

    return new GridPanelSpec(sizeInGrids, variantId, holes, holeVariant) as this
  }
}

export type GridPanelSpecSerialized = {
  type: GridPanelType
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  holes: GridPanelHoles
  holeVariant: GridPanelSpecHoleVariant
}
function serializeSpec(instance: GridPanelSpec): GridPanelSpecSerialized {
  const { variantId, sizeInGrids, holes, holeVariant } = instance
  return { type: 'gridpanel', variantId, sizeInGrids, holes, holeVariant }
}
function deserializeSpec(object: GridPanelSpecSerialized): GridPanelSpec {
  const { variantId, sizeInGrids, holes, holeVariant } = object
  return new GridPanelSpec(sizeInGrids, variantId, holes, holeVariant)
}

export class GridPanel extends BasePartCreator<GridPanelSpec> {
  static create(options: GridPanelOptions) {
    const { id, variantId, sizeInGrids, holes, holeVariant } = options
    const spec = new GridPanelSpec(sizeInGrids, variantId, holes, holeVariant)
    return new GridPanel(spec, id)
  }

  static XY(options: GridPanelXYOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      x,
      y,
      z,
      fit = 'bottom',
      holes,
      holeVariant = 'half',
    } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)

    const safeX = parseRange(x, 0)
    const safeY = parseRange(y, 0)
    const safeZ = parseNumber(z, 0)

    let panel = GridPanel.create({
      id,
      variantId,
      sizeInGrids: [Math.abs(safeX[0] - safeX[1]), Math.abs(safeY[0] - safeY[1])],
      holes,
      holeVariant: toSpecHoleVariant(holeVariant),
    })

    if (safeX[0] > safeX[1]) {
      panel = panel.applyTransform(mirrorXTransform)
    }
    if (safeY[0] > safeY[1]) {
      panel = panel.applyTransform(mirrorYTransform)
    }
    if (fit === 'top') {
      panel = panel.applyTransform(mirrorZTransform)
    }
    if (options.flip) {
      panel = panel.applyTransform(mirrorZTransform)
    }
    if (holeVariant === 'half-reverse') {
      panel = panel.applyTransform(mirrorZTransform)
    }

    panel = panel.translate([safeX[0] * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])

    if (fit === 'bottom') {
      panel = panel.translate([0, 0, -0.5 * (gridUnit - thickness)])
    } else if (fit === 'top') {
      panel = panel.translate([0, 0, 0.5 * (gridUnit - thickness)])
    }

    return panel
  }

  static YZ(options: GridPanelYZOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      x,
      y,
      z,
      fit = 'bottom',
      holes,
      holeVariant = 'half',
    } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)

    const safeX = parseNumber(x, 0)
    const safeY = parseRange(y, 0)
    const safeZ = parseRange(z, 0)

    let panel = GridPanel.create({
      id,
      variantId,
      sizeInGrids: [Math.abs(safeY[0] - safeY[1]), Math.abs(safeZ[0] - safeZ[1])],
      holes,
      holeVariant: toSpecHoleVariant(holeVariant),
    }).applyTransform(xyToYZTransform)

    if (safeY[0] > safeY[1]) {
      panel = panel.applyTransform(mirrorYTransform)
    }
    if (safeZ[0] > safeZ[1]) {
      panel = panel.applyTransform(mirrorZTransform)
    }
    if (fit === 'top') {
      panel = panel.applyTransform(mirrorXTransform)
    }
    if (options.flip) {
      panel = panel.applyTransform(mirrorXTransform)
    }
    if (holeVariant === 'half-reverse') {
      panel = panel.applyTransform(mirrorXTransform)
    }

    panel = panel.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ[0] * gridUnit])

    if (fit === 'bottom') {
      panel = panel.translate([-0.5 * (gridUnit - thickness), 0, 0])
    } else if (fit === 'top') {
      panel = panel.translate([0.5 * (gridUnit - thickness), 0, 0])
    }

    return panel
  }

  static XZ(options: GridPanelXZOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      x,
      y,
      z,
      fit = 'bottom',
      holes,
      holeVariant = 'half',
    } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)

    const safeX = parseRange(x, 0)
    const safeY = parseNumber(y, 0)
    const safeZ = parseRange(z, 0)

    const sizeInGrids: [number, number] = [
      Math.abs(safeX[0] - safeX[1]),
      Math.abs(safeZ[0] - safeZ[1]),
    ]

    let panel = GridPanel.create({
      id,
      variantId,
      sizeInGrids,
      holes,
      holeVariant: toSpecHoleVariant(holeVariant),
    }).applyTransform(xyToXZTransform)

    if (safeX[0] > safeX[1]) {
      panel = panel.applyTransform(mirrorXTransform)
    }
    if (safeZ[0] > safeZ[1]) {
      panel = panel.applyTransform(mirrorZTransform)
    }
    if (fit === 'top') {
      panel = panel.applyTransform(mirrorYTransform)
    }
    if (options.flip) {
      panel = panel.applyTransform(mirrorYTransform)
    }
    if (holeVariant === 'half-reverse') {
      panel = panel.applyTransform(mirrorYTransform)
    }

    panel = panel.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])

    if (fit === 'bottom') {
      panel = panel.translate([0, -0.5 * (gridUnit - thickness), 0])
    } else if (fit === 'top') {
      panel = panel.translate([0, 0.5 * (gridUnit - thickness), 0])
    }

    return panel
  }
}

interface BaseOptions {
  id?: string
  holes?: GridPanelHoles
}

interface GridPanelOptions extends BaseOptions {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  holeVariant?: GridPanelSpecHoleVariant
}

interface GridPanelXYOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: [number, number]
  y: [number, number]
  z: number
  fit?: GridPanelFit
  flip?: boolean
  holeVariant?: GridPanelHoleVariant
}

interface GridPanelYZOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: number
  y: [number, number]
  z: [number, number]
  fit?: GridPanelFit
  flip?: boolean
  holeVariant?: GridPanelHoleVariant
}

interface GridPanelXZOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: [number, number]
  y: number
  z: [number, number]
  fit?: GridPanelFit
  flip?: boolean
  holeVariant?: GridPanelHoleVariant
}

function getVariant(variantId: string): GridPanelVariant {
  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }
  return variant
}

function getGridLength(variant: GridPanelVariant): number {
  const { gridLength } = variant
  return convert(gridLength, meter).value
}

function getThickness(variant: GridPanelVariant): number {
  const { thickness } = variant
  return convert(thickness, meter).value
}

registerSerializer({
  type: 'gridpanel',
  serializeSpec,
  deserializeSpec,
  Creator: GridPanel,
})

function holesEquals(a: GridPanelHoles, b: GridPanelHoles) {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) {
      const holeA = a[i]!
      const holeB = b[i]!
      if (holeA[0] !== holeB[0] && holeA[1] !== holeB[1]) {
        return false
      }
    }
    return true
  }
  return a === b
}

type XY = [number, number]
// XY sort comparator for ascending order
function compareXYs(a: XY, b: XY) {
  if (a[0] === b[0]) {
    // if x values are the same, compare y values
    return a[1] - b[1]
  }
  // otherwise, compare x values
  return a[0] - b[0]
}

function toSpecHoleVariant(holeVariant: GridPanelHoleVariant) {
  switch (holeVariant) {
    case 'through':
      return 'through'
    case 'half':
    case 'half-reverse':
      return 'half'
  }
}

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
