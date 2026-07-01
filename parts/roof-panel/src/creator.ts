import { changeOfBasisTransform } from '@villagekit/math'
import {
  BasePartCreator,
  BasePartSpec,
  partBasis,
  registerSerializer,
} from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { RoofPanelType } from './types'
import { roofPanelVariants } from './variants'

const getDefaultVariantId = (): keyof typeof roofPanelVariants => 'RoofPanel_TimberFrame'

export class RoofPanelSpec extends BasePartSpec<RoofPanelType> {
  variantId: keyof typeof roofPanelVariants
  lengthInGrids: number
  widthInGrids: number
  heightInGrids: number
  pitchDeg: number
  materialId: string

  constructor(
    lengthInGrids: number,
    widthInGrids: number,
    heightInGrids: number,
    pitchDeg: number,
    variantId?: keyof typeof roofPanelVariants,
    materialId = 'TimberMGP10',
  ) {
    super('roof-panel')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.widthInGrids = widthInGrids
    this.heightInGrids = heightInGrids
    this.pitchDeg = pitchDeg
    this.materialId = materialId
  }

  id(): string {
    return `RoofPanel_${this.lengthInGrids}x${this.widthInGrids}x${this.heightInGrids}gu_${this.pitchDeg}deg_${this.variantId}_${this.materialId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.lengthInGrids === other.lengthInGrids &&
      this.widthInGrids === other.widthInGrids &&
      this.heightInGrids === other.heightInGrids &&
      this.pitchDeg === other.pitchDeg &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    const lDiff = other.lengthInGrids - this.lengthInGrids
    if (lDiff !== 0) return lDiff
    return other.pitchDeg - this.pitchDeg
  }
}

export type RoofPanelSpecSerialized = {
  type: RoofPanelType
  variantId: keyof typeof roofPanelVariants
  lengthInGrids: number
  widthInGrids: number
  heightInGrids: number
  pitchDeg: number
  materialId: string
}

function serializeSpec(instance: RoofPanelSpec): RoofPanelSpecSerialized {
  const { variantId, lengthInGrids, widthInGrids, heightInGrids, pitchDeg, materialId } = instance
  return {
    type: 'roof-panel',
    variantId,
    lengthInGrids,
    widthInGrids,
    heightInGrids,
    pitchDeg,
    materialId,
  }
}

function deserializeSpec(object: RoofPanelSpecSerialized): RoofPanelSpec {
  const { variantId, lengthInGrids, widthInGrids, heightInGrids, pitchDeg, materialId } = object
  return new RoofPanelSpec(
    lengthInGrids,
    widthInGrids,
    heightInGrids,
    pitchDeg,
    variantId,
    materialId,
  )
}

export class RoofPanel extends BasePartCreator<RoofPanelSpec> {
  static create(options: RoofPanelCreateOptions) {
    const { id, variantId, lengthInGrids, widthInGrids, heightInGrids, pitchDeg, materialId } =
      options
    const spec = new RoofPanelSpec(
      lengthInGrids,
      widthInGrids,
      heightInGrids,
      pitchDeg,
      variantId,
      materialId,
    )
    return new RoofPanel(spec, id)
  }

  // Place a roof panel module spanning across the world X direction (width).
  // x:      west edge of the module in gu
  // yStart: back eave in gu (higher end of slope)
  // yEnd:   front eave in gu (lower end of slope)
  // zStart: world Z at the back eave in gu
  // pitchDeg: roof pitch in degrees from horizontal
  static X(options: RoofPanelXOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      x,
      yStart,
      yEnd,
      zStart,
      pitchDeg,
      materialId,
    } = options

    const G = getGridLengthInMeters(variantId)
    const pitchRad = (pitchDeg * Math.PI) / 180
    const slopedLengthGu = (yEnd - yStart) / Math.cos(pitchRad)

    // Pitched basis maps canonical axes into world space:
    //   canonical X → slope direction (along Y, descending in Z)
    //   canonical Y → outward normal to the roof surface
    //   canonical Z → world X (across the module width)
    const pitchedBasis: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ] = [
      [0, Math.cos(pitchRad), -Math.sin(pitchRad)], // canonical X → slope direction
      [0, Math.sin(pitchRad), Math.cos(pitchRad)], //  canonical Y → outward normal
      [1, 0, 0], //                                    canonical Z → world X (width)
    ]
    const roofTransform = changeOfBasisTransform(partBasis, pitchedBasis)

    return RoofPanel.create({
      id,
      variantId,
      lengthInGrids: slopedLengthGu,
      widthInGrids: 30,
      heightInGrids: 3,
      pitchDeg,
      materialId,
    })
      .applyTransform(roofTransform)
      .translate([x * G, yStart * G, zStart * G])
  }
}

interface RoofPanelCreateOptions {
  id?: string
  variantId?: keyof typeof roofPanelVariants
  lengthInGrids: number
  widthInGrids: number
  heightInGrids: number
  pitchDeg: number
  materialId?: string
}

interface RoofPanelXOptions {
  id?: string
  variantId?: keyof typeof roofPanelVariants
  x: number
  yStart: number
  yEnd: number
  zStart: number
  pitchDeg: number
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = roofPanelVariants[variantId]
  if (variant == null) throw new Error(`Unknown roof-panel variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'roof-panel',
  serializeSpec,
  deserializeSpec,
  Creator: RoofPanel,
})
