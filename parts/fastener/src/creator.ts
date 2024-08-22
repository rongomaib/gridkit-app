import { AxisId, type Point3, axisIdToDirectionVector } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import { Matrix4, Quaternion, Vector3 } from 'three'
import type { FastenerType } from './types'
import { fastenerVariants } from './variants'

export class FastenerSpec extends BasePartSpec<FastenerType> {
  variantId: keyof typeof fastenerVariants

  constructor(variantId: keyof typeof fastenerVariants) {
    super('fastener')
    this.variantId = variantId
  }

  id(): string {
    return `Fastener_${this.variantId}`
  }

  equals(other: this): boolean {
    return this.type === other.type && this.variantId === other.variantId
  }

  compare(other: this): number {
    return (
      fastenerVariants[this.variantId]!.fastenedLength.value -
      fastenerVariants[other.variantId]!.fastenedLength.value
    )
  }
}

export type FastenerSpecSerialized = {
  type: FastenerType
  variantId: keyof typeof fastenerVariants
}
function serializeSpec(instance: FastenerSpec): FastenerSpecSerialized {
  const { variantId } = instance
  return { type: 'fastener', variantId }
}
function deserializeSpec(object: FastenerSpecSerialized): FastenerSpec {
  const { variantId } = object
  return new FastenerSpec(variantId)
}

export class Fastener extends BasePartCreator<FastenerSpec> {
  static create(options: FastenerOptions) {
    const { variantId, id } = options
    const spec = new FastenerSpec(variantId)
    return new Fastener(spec, id)
  }

  static Grid(options: FastenerLineOptions) {
    const { id, variantId, start, end } = options

    const variant = fastenerVariants[variantId]!
    const gridUnit = convert(variant.gridLength, meter).value

    const direction = new Vector3(...end).sub(new Vector3(...start)).normalize()

    const rotation = new Matrix4()
      .makeRotationFromQuaternion(
        new Quaternion().setFromUnitVectors(axisIdToDirectionVector(AxisId.X), direction),
      )
      .toArray()
    const offset = direction
      .clone()
      .multiplyScalar(0.5 * gridUnit)
      .toArray()

    return Fastener.create({
      id,
      variantId,
    })
      .applyRotation({ rotation })
      .translate(offset)
      .translate([start[0] * gridUnit, start[1] * gridUnit, start[2] * gridUnit])
  }
}

interface BaseCreatorOptions {
  id?: string
  variantId: keyof typeof fastenerVariants
}

interface FastenerOptions extends BaseCreatorOptions {}

interface FastenerLineOptions extends BaseCreatorOptions {
  start: Point3
  end: Point3
}

registerSerializer({
  type: 'fastener',
  serializeSpec,
  deserializeSpec,
  Creator: Fastener,
})
