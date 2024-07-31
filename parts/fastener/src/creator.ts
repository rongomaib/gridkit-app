import { AxisId, type Point3, axisIdToDirectionVector } from '@villagekit/math'
import { BasePartCreator } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { fastenerVariants } from './variants'

export class Fastener extends BasePartCreator<'fastener'> {
  variantId: keyof typeof fastenerVariants

  constructor(options: FastenerOptions) {
    const { id, variantId } = options
    super('fastener', id)
    this.variantId = variantId
  }

  static create(options: FastenerOptions) {
    return new Fastener(options)
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

    return new Fastener({
      id,
      variantId,
    })
      .applyRotation({ rotation })
      .translate(offset)
      .translate([start[0] * gridUnit, start[1] * gridUnit, start[2] * gridUnit])
  }
}

interface BaseOptions {
  id?: string
  variantId: keyof typeof fastenerVariants
}

interface FastenerOptions extends BaseOptions {}

interface FastenerLineOptions extends BaseOptions {
  start: Point3
  end: Point3
}
