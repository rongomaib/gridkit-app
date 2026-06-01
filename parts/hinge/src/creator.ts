import { changeOfBasisTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import type { HingeType } from './types'
import { hingeVariants } from './variants'

const getDefaultVariantId = (): keyof typeof hingeVariants => 'HeavyDuty_62x63'

const GRID_UNIT = 0.04    // 40mm in metres
const LEAF_THICKNESS = 0.004 // plate thickness (same as gl.tsx)
const BEAM_HALF_WIDTH = GRID_UNIT / 2 // 20mm — half of 40×40 mm gridbeam

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]
const NEG_Y_AXIS: [number, number, number] = [0, -1, 0]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const

const HOLE_Y_BOTTOM = 0.0115 // y of lower hole centre from bottom of hinge (matches gl.tsx)

// local Y (barrel) → world Z (vertical), local Z (plate normal) → world +X (right face of post)
const rxPlus90Transform = changeOfBasisTransform(baseBasis, [NEG_Y_AXIS, Z_AXIS, X_AXIS])

// Y position (grid units) for door panel when using Hinge.Door
export const HINGE_DOOR_PANEL_Y = 0

export class HingeSpec extends BasePartSpec<HingeType> {
  variantId: keyof typeof hingeVariants
  angle: number // degrees: 0=folded closed, 90=door perpendicular, 180=flat open

  constructor(angle: number, variantId?: keyof typeof hingeVariants) {
    super('hinge')
    this.variantId = variantId ?? getDefaultVariantId()
    this.angle = angle
  }

  id(): string {
    return `Hinge_${this.variantId}`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.angle === other.angle
    )
  }

  compare(_other: this): number {
    return 0
  }
}

export type HingeSpecSerialized = {
  type: HingeType
  variantId: keyof typeof hingeVariants
  angle: number
}

function serializeSpec(instance: HingeSpec): HingeSpecSerialized {
  return { type: 'hinge', variantId: instance.variantId, angle: instance.angle }
}

function deserializeSpec(object: HingeSpecSerialized): HingeSpec {
  return new HingeSpec(object.angle, object.variantId)
}

export class Hinge extends BasePartCreator<HingeSpec> {
  static create(options: HingeCreateOptions) {
    const { id, variantId, angle = 180 } = options
    const spec = new HingeSpec(angle, variantId)
    return new Hinge(spec, id)
  }

  /**
   * Place a door hinge with barrel vertical, plate against the front (y=0) face.
   * x and z are grid-unit positions. angle: 180=flat open (door closed), 90=door open 90°.
   */
  static Door(options: HingeDoorOptions) {
    const { id, variantId = getDefaultVariantId(), x, z, angle = 180 } = options

    let hinge = Hinge.create({ id, variantId, angle })
    hinge = hinge.applyTransform(rxPlus90Transform)
    hinge = hinge.translate([
      x * GRID_UNIT + BEAM_HALF_WIDTH + LEAF_THICKNESS / 2,
      -BEAM_HALF_WIDTH,
      z * GRID_UNIT - HOLE_Y_BOTTOM,
    ])
    return hinge
  }
}

interface HingeCreateOptions {
  id?: string
  variantId?: keyof typeof hingeVariants
  angle?: number
}

export interface HingeDoorOptions {
  id?: string
  variantId?: keyof typeof hingeVariants
  x: number // grid units — left post column of the bay
  z: number // grid units — bottom of hinge
  angle?: number // degrees
}

registerSerializer({
  type: 'hinge',
  serializeSpec,
  deserializeSpec,
  Creator: Hinge,
})
