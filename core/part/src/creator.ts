import { type TransformMatrix, degToRad } from '@villagekit/math'
import { Matrix4, Vector3 } from 'three'

export interface Typed<Type extends string> {
  type: Type
}

export type TypeOf<T> = T extends Typed<infer Type> ? Type : never

export type RotateOptions = {
  angle: number
  origin?: [number, number, number]
  direction?: [number, number, number]
}

export type ApplyRotationOptions = {
  origin?: [number, number, number]
  rotation: TransformMatrix
}

export type SpecOfCreator<Creator> = Creator extends BasePartCreator<infer Spec> ? Spec : never

export class BasePartCreator<Spec extends Typed<any>> {
  spec: Spec
  id?: string
  transform: TransformMatrix

  get type() {
    return this.spec.type
  }

  constructor(spec: Spec, id?: string, transform: TransformMatrix = new Matrix4().toArray()) {
    this.spec = spec
    this.id = id
    this.transform = transform
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  translate(vector: [number, number, number]) {
    const next = this.clone()
    const matrix = new Matrix4().fromArray(this.transform)
    matrix.premultiply(new Matrix4().makeTranslation(...vector))
    next.transform = matrix.toArray()
    return next
  }

  applyRotation(options: ApplyRotationOptions) {
    const { origin, rotation } = options

    const next = this.clone()
    const matrix = new Matrix4().fromArray(this.transform)
    const rotationMatrix = new Matrix4().fromArray(rotation)

    if (origin != null) {
      // https://stackoverflow.com/a/55138754
      const pivotMatrix = new Matrix4().makeTranslation(new Vector3(...origin))
      const pivotInverseMatrix = pivotMatrix.clone().invert()
      matrix.premultiply(pivotInverseMatrix)
      matrix.premultiply(rotationMatrix)
      matrix.premultiply(pivotMatrix)
    } else {
      matrix.premultiply(rotationMatrix)
    }

    next.transform = matrix.toArray()

    return next
  }

  rotate(options: RotateOptions) {
    const { angle, origin, direction = [0, 0, 1] } = options
    const rotation = new Matrix4()
      .makeRotationAxis(new Vector3(...direction), degToRad(angle))
      .toArray()
    return this.applyRotation({ origin, rotation })
  }

  applyTransform(transform: TransformMatrix) {
    const next = this.clone()
    const matrixAppliedTo = new Matrix4().fromArray(this.transform)
    const matrixToApply = new Matrix4().fromArray(transform)
    matrixAppliedTo.premultiply(matrixToApply)
    next.transform = matrixAppliedTo.toArray()
    return next
  }
}

type Serializer<
  Type extends string,
  Spec extends { new (...args: Array<any>): Typed<Type> },
  SpecSerialized extends Typed<Type>,
  Creator extends typeof BasePartCreator<InstanceType<Spec>>,
  CreatorSerialized extends Typed<Type> = DefaultCreatorSerialized<SpecSerialized>,
> = {
  type: Type
  Spec: Spec
  serializeSpec: (instance: InstanceType<Spec>) => SpecSerialized
  deserializeSpec: (object: SpecSerialized) => InstanceType<Spec>
  Creator: Creator
  serializeCreator: (instance: InstanceType<Creator>) => CreatorSerialized
  deserializeCreator: (object: CreatorSerialized) => InstanceType<Creator>
}

type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface Serializers {
  [Type: string]: Serializer<typeof Type, any, any, any, any>
}

const serializers: Serializers = {}

export function registerSerializer<
  Type extends string,
  Spec extends { new (...args: Array<any>): Typed<Type> },
  SpecSerialized extends Typed<Type>,
  Creator extends typeof BasePartCreator<InstanceType<Spec>>,
  CreatorSerialized extends Typed<Type> = DefaultCreatorSerialized<SpecSerialized>,
>(
  options: Optional<
    Serializer<Type, Spec, SpecSerialized, Creator, CreatorSerialized>,
    'serializeCreator' | 'deserializeCreator'
  >,
) {
  const {
    type,
    Spec,
    serializeSpec,
    deserializeSpec,
    Creator,
    serializeCreator = defaultSerializeCreator,
    deserializeCreator = defaultDeserializeCreator,
  } = options
  serializers[type] = {
    type,
    Spec,
    deserializeSpec,
    serializeSpec,
    Creator,
    deserializeCreator,
    serializeCreator,
  }
}

function getSerializer(type: string): Serializer<any, any, any, any, any> {
  const serializer = serializers[type]
  if (serializer == null) {
    throw new Error(`Unknown serializer type: ${type}`)
  }
  return serializer
}

export function serializeSpec(instance: any): any {
  const serializer = getSerializer(instance.type)
  return serializer.serializeSpec(instance)
}

export function serializeCreator(instance: any): any {
  const serializer = getSerializer(instance.type)
  return serializer.serializeCreator(instance)
}

export function deserializeSpec(instance: any): any {
  const serializer = getSerializer(instance.type)
  return serializer.deserializeSpec(instance)
}

export function deserializeCreator(object: any): any {
  const serializer = getSerializer(object.type)
  return serializer.deserializeCreator(object)
}

type DefaultCreatorSerialized<SpecSerialized extends Typed<any>> = {
  type: SpecSerialized['type']
  spec: SpecSerialized
  id?: string
  transform: TransformMatrix
}

function defaultSerializeCreator<
  Type extends string,
  Spec extends { new (...args: Array<any>): Typed<Type> },
  SpecSerialized extends Typed<Type>,
  Creator extends typeof BasePartCreator<InstanceType<Spec>>,
>(
  this: Serializer<Type, Spec, SpecSerialized, Creator, DefaultCreatorSerialized<SpecSerialized>>,
  creator: InstanceType<Creator>,
): DefaultCreatorSerialized<SpecSerialized> {
  const { spec: specInstance, id, transform } = creator
  const spec = this.serializeSpec(specInstance)
  return {
    type: spec.type,
    spec,
    id,
    transform,
  }
}

function defaultDeserializeCreator<
  Type extends string,
  Spec extends { new (...args: Array<any>): Typed<Type> },
  SpecSerialized extends Typed<Type>,
  Creator extends typeof BasePartCreator<InstanceType<Spec>>,
>(
  this: Serializer<Type, Spec, SpecSerialized, Creator, DefaultCreatorSerialized<SpecSerialized>>,
  object: DefaultCreatorSerialized<SpecSerialized>,
): InstanceType<Creator> {
  const { spec: specObject, id, transform } = object
  const spec = this.deserializeSpec(specObject)
  return new this.Creator(spec, id, transform) as InstanceType<Creator>
}
