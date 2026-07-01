import { changeOfBasisTransform } from '@villagekit/math'
import {
  BasePartCreator,
  BasePartSpec,
  partBasis,
  registerSerializer,
} from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { RoofingIronType } from './types'
import { roofingIronVariants } from './variants'

const getDefaultVariantId = (): keyof typeof roofingIronVariants => 'RoofingIron_Galvanised'

export class RoofingIronSpec extends BasePartSpec<RoofingIronType> {
  variantId: keyof typeof roofingIronVariants
  slopedLengthGu: number
  widthInGrids: number
  offsetGu: number
  pitchDeg: number
  materialId: string

  constructor(
    slopedLengthGu: number,
    widthInGrids: number,
    offsetGu: number,
    pitchDeg: number,
    variantId?: keyof typeof roofingIronVariants,
    materialId = 'Galvanised',
  ) {
    super('roofing-iron')
    this.variantId = variantId ?? getDefaultVariantId()
    this.slopedLengthGu = slopedLengthGu
    this.widthInGrids = widthInGrids
    this.offsetGu = offsetGu
    this.pitchDeg = pitchDeg
    this.materialId = materialId
  }

  id(): string {
    return `RoofingIron_${Math.round(this.slopedLengthGu)}x${this.widthInGrids}gu_${this.pitchDeg}deg_${this.variantId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.slopedLengthGu === other.slopedLengthGu &&
      this.widthInGrids === other.widthInGrids &&
      this.offsetGu === other.offsetGu &&
      this.pitchDeg === other.pitchDeg &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    return other.slopedLengthGu - this.slopedLengthGu
  }
}

export type RoofingIronSpecSerialized = {
  type: RoofingIronType
  variantId: keyof typeof roofingIronVariants
  slopedLengthGu: number
  widthInGrids: number
  offsetGu: number
  pitchDeg: number
  materialId: string
}

function serializeSpec(instance: RoofingIronSpec): RoofingIronSpecSerialized {
  const { variantId, slopedLengthGu, widthInGrids, offsetGu, pitchDeg, materialId } = instance
  return {
    type: 'roofing-iron',
    variantId,
    slopedLengthGu,
    widthInGrids,
    offsetGu,
    pitchDeg,
    materialId,
  }
}

function deserializeSpec(object: RoofingIronSpecSerialized): RoofingIronSpec {
  const { variantId, slopedLengthGu, widthInGrids, offsetGu, pitchDeg, materialId } = object
  return new RoofingIronSpec(slopedLengthGu, widthInGrids, offsetGu, pitchDeg, variantId, materialId)
}

export class RoofingIron extends BasePartCreator<RoofingIronSpec> {
  static create(options: RoofingIronCreateOptions) {
    const { id, variantId, slopedLengthGu, widthInGrids, offsetGu, pitchDeg, materialId } =
      options
    const spec = new RoofingIronSpec(
      slopedLengthGu,
      widthInGrids,
      offsetGu,
      pitchDeg,
      variantId,
      materialId,
    )
    return new RoofingIron(spec, id)
  }

  // Place a roofing iron sheet spanning the world X direction.
  // x:        [west edge, east edge] in gu
  // yStart:   back (high) eave in gu
  // yEnd:     front (low) eave in gu
  // zStart:   world Z at back eave in gu (same reference as RoofPanel.X zStart)
  // pitchDeg: roof pitch in degrees
  // offsetGu: distance above cassette origin in roof-normal direction.
  //           Default 4 = 3gu edge-beam + 1gu purlin, placing the sheet on purlin tops.
  static X(options: RoofingIronXOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      x,
      yStart,
      yEnd,
      zStart,
      pitchDeg,
      offsetGu = 4,
      materialId,
    } = options

    const G = getGridLengthInMeters(variantId)
    const pitchRad = (pitchDeg * Math.PI) / 180
    const run = yEnd - yStart
    const slopedLengthGu = run / Math.cos(pitchRad)
    const widthInGrids = x[1] - x[0]

    // Same pitched basis as RoofPanel — places canonical X along slope, Y outward-normal, Z across width
    const pitchedBasis: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ] = [
      [0, Math.cos(pitchRad), -Math.sin(pitchRad)],
      [0, Math.sin(pitchRad), Math.cos(pitchRad)],
      [1, 0, 0],
    ]
    const roofTransform = changeOfBasisTransform(partBasis, pitchedBasis)

    return RoofingIron.create({
      id,
      variantId,
      slopedLengthGu,
      widthInGrids,
      offsetGu,
      pitchDeg,
      materialId,
    })
      .applyTransform(roofTransform)
      .translate([x[0] * G, yStart * G, zStart * G])
  }
}

interface RoofingIronCreateOptions {
  id?: string
  variantId?: keyof typeof roofingIronVariants
  slopedLengthGu: number
  widthInGrids: number
  offsetGu: number
  pitchDeg: number
  materialId?: string
}

interface RoofingIronXOptions {
  id?: string
  variantId?: keyof typeof roofingIronVariants
  x: [number, number]
  yStart: number
  yEnd: number
  zStart: number
  pitchDeg: number
  offsetGu?: number
  materialId?: string
}

function getGridLengthInMeters(variantId: string): number {
  const variant = roofingIronVariants[variantId]
  if (variant == null) throw new Error(`Unknown roofing-iron variant: ${variantId}`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: 'roofing-iron',
  serializeSpec,
  deserializeSpec,
  Creator: RoofingIron,
})
