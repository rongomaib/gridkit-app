// notes
// - https://en.wikipedia.org/wiki/Dimensional_analysis
// - safe-units
//
// goals:
// - simple and explicit
// - tree-shake-able

export enum SystemOfUnits {
  Metric = 'Metric',
  Imperial = 'Imperial',
}

export enum BaseDimension {
  Length = 'Length',
  Mass = 'Mass',
}

export enum CompositeDimension {
  Area = 'Area',
  Volume = 'Volume',
}

export type Dimension = BaseDimension | CompositeDimension
export type Exponent = -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5
export type DimensionComposition = Record<BaseDimension, Exponent>

export interface BaseUnit<Dim extends BaseDimension> {
  type: 'unit:base'
  system: SystemOfUnits
  dimension: Dim
  name: string
  symbol: string
}

export interface CompositeUnit<Dim extends CompositeDimension> {
  type: 'unit:composite'
  system: SystemOfUnits
  name: string
  symbol?: string
  dimension: Dim
  /*
  baseUnits: {
    [Dim in keyof BaseUnit]: Exponent
  }
  */
}

export interface ConversionUnit<Dim extends Dimension> {
  type: 'unit:conversion'
  system: SystemOfUnits
  name: string
  symbol: string
  conversionFactor: number
  toUnit: Unit<Dim>
}

export interface PrefixUnit<Dim extends Dimension> {
  type: 'unit:prefix'
  system: SystemOfUnits
  name: string
  symbol: string
  multiplier: number
  forUnit: Unit<Dim>
}

/*
export type Unit<Dimension> =
  Dimension extends BaseDimension
    ? BaseUnit<BaseDimension>
    : Dimension extends CompositeDimension
      ? CompositeUnit<CompositeDimension>
      : ConversionUnit<Dimension> | PrefixUnit<Dimension>
*/
export type Unit<Dim extends Dimension> = Dim extends BaseDimension
  ? BaseUnit<Dim> | ConversionUnit<Dim> | PrefixUnit<Dim>
  : Dim extends CompositeDimension
    ? CompositeUnit<Dim> | ConversionUnit<Dim> | PrefixUnit<Dim>
    : never

export interface Quantity<Dim extends Dimension, Value = number> {
  type: 'quantity'
  value: Value
  unit: Unit<Dim>
}

interface Prefix {
  name: string
  symbol: string
  multiplier: number
}

const micro: Prefix = { multiplier: 1e-6, name: 'milli', symbol: 'μ' }
const milli: Prefix = { multiplier: 1e-3, name: 'milli', symbol: 'm' }
const kilo: Prefix = { multiplier: 1e3, name: 'kilo', symbol: 'k' }

function prefixUnit<Dim extends Dimension>(prefix: Prefix, unit: Unit<Dim>): PrefixUnit<Dim> {
  return {
    forUnit: unit,
    multiplier: prefix.multiplier,
    name: `${prefix.name}${unit.name}`,
    symbol: `${prefix.symbol}${unit.symbol || ''}`,
    system: unit.system,
    type: 'unit:prefix',
  }
}

//
// length
//
export type Length<Value = number> = Quantity<BaseDimension.Length, Value>
export const meter: BaseUnit<BaseDimension.Length> = {
  dimension: BaseDimension.Length,
  name: 'meter',
  symbol: 'm',
  system: SystemOfUnits.Metric,
  type: 'unit:base',
}
export const micrometer = prefixUnit<BaseDimension.Length>(micro, meter)
export const millimeter = prefixUnit<BaseDimension.Length>(milli, meter)
export const kilometer = prefixUnit<BaseDimension.Length>(kilo, meter)
export const inch: ConversionUnit<BaseDimension.Length> = {
  conversionFactor: 0.0254,
  name: 'inch',
  symbol: 'in',
  system: SystemOfUnits.Imperial,
  toUnit: meter,
  type: 'unit:conversion',
}

//
// mass
//
export type Mass<Value = number> = Quantity<BaseDimension.Mass, Value>
export const gram: BaseUnit<BaseDimension.Mass> = {
  dimension: BaseDimension.Mass,
  name: 'gram',
  symbol: 'g',
  system: SystemOfUnits.Metric,
  type: 'unit:base',
}
export const microgram = prefixUnit<BaseDimension.Mass>(micro, gram)
export const milligram = prefixUnit<BaseDimension.Mass>(milli, gram)
export const kilogram = prefixUnit<BaseDimension.Mass>(kilo, gram)
export const pound: ConversionUnit<BaseDimension.Mass> = {
  conversionFactor: 453.59237,
  name: 'pound',
  symbol: 'lb',
  system: SystemOfUnits.Imperial,
  toUnit: gram,
  type: 'unit:conversion',
}

//
// volume
//
export type Volume<Value = number> = Quantity<CompositeDimension.Volume, Value>
export const cubicMeter: CompositeUnit<CompositeDimension.Volume> = {
  dimension: CompositeDimension.Volume,
  name: 'cubic meter',
  symbol: '㎥',
  system: SystemOfUnits.Metric,
  type: 'unit:composite',
}
export const liter: ConversionUnit<CompositeDimension.Volume> = {
  conversionFactor: 0.001,
  name: 'liter',
  symbol: 'L',
  system: SystemOfUnits.Metric,
  toUnit: cubicMeter,
  type: 'unit:conversion',
}
export const microliter = prefixUnit<CompositeDimension.Volume>(micro, liter)
export const milliliter = prefixUnit<CompositeDimension.Volume>(milli, liter)
export const kiloliter = prefixUnit<CompositeDimension.Volume>(kilo, liter)

function toBaseValue<Dim extends Dimension>(unit: Unit<Dim>): number {
  switch (unit.type) {
    case 'unit:base':
    case 'unit:composite':
      return 1
    case 'unit:conversion': {
      const conversionUnit = unit as ConversionUnit<Dim>
      return conversionUnit.conversionFactor * toBaseValue(conversionUnit.toUnit)
    }
    case 'unit:prefix': {
      const prefixUnit = unit as PrefixUnit<Dim>
      return prefixUnit.multiplier * toBaseValue(prefixUnit.forUnit)
    }
  }
}

// TODO memoize
export function calculateConversionFactor<Dim extends Dimension>(
  fromUnit: Unit<Dim>,
  toUnit: Unit<Dim>,
): number {
  const fromUnitBaseValue = toBaseValue(fromUnit)
  const toUnitBaseValue = toBaseValue(toUnit)
  return fromUnitBaseValue / toUnitBaseValue
}

export function convert<Dim extends Dimension>(
  quantity: Quantity<Dim, number>,
  toUnit: Unit<Dim>,
): Quantity<Dim> {
  const { value, unit: fromUnit } = quantity
  const conversionFactor = calculateConversionFactor(fromUnit, toUnit)
  const convertedValue = conversionFactor * value
  return {
    type: 'quantity',
    unit: toUnit,
    value: convertedValue,
  }
}
