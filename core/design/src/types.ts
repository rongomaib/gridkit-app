import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  Presets,
} from '@villagekit/parameters'
import { PartCreator, PartVariantsByType } from '@villagekit/part'
import { z } from 'zod'

import { AssemblyPlugin } from './plugins'
import { designCategorySchema, designMetaSchema } from './schema'

export type DesignPart = WithOptionalId<PartCreator>
export type DesignParts = RecursiveArray<DesignPart | false | undefined | null>

export type DesignCategory = z.infer<typeof designCategorySchema>

export type DesignMeta = z.infer<typeof designMetaSchema>

export function DesignMeta(designMeta: DesignMeta): DesignMeta {
  return designMeta
}

export interface DesignAssemblyBase {
  plugins?: Array<AssemblyPlugin>
}

export interface DesignAssemblyStatic extends DesignAssemblyBase {
  type: 'static'
  parts: DesignParts
}

export interface DesignAssemblyParameterized<ParamsOptions extends ParametersOptions>
  extends DesignAssemblyBase {
  type: 'parameterized'
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
  createParts: (
    parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
    partVariants: PartVariantsByType,
  ) => DesignParts
}

export type DesignAssembly = DesignAssemblyStatic | DesignAssemblyParameterized<any>

export function DesignAssembly(assembly: Omit<DesignAssemblyStatic, 'type'>): DesignAssemblyStatic {
  return {
    type: 'static',
    ...assembly,
  }
}

export function DesignAssemblyParameterized<ParamsOptions extends ParametersOptions,>(
  assembly: Omit<DesignAssemblyParameterized<ParamsOptions>, 'type'>,
): DesignAssemblyParameterized<ParamsOptions> {
  return {
    type: 'parameterized',
    ...assembly,
  }
}

export interface DesignInstanceStatic {
  type: 'static'
  meta: DesignMeta
  assembly: DesignAssemblyStatic
}

export interface DesignInstanceParameterized<ParamsOptions extends ParametersOptions,> {
  type: 'parameterized'
  meta: DesignMeta
  assembly: DesignAssemblyParameterized<ParamsOptions>
  parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null
}

export type DesignInstance = DesignInstanceStatic | DesignInstanceParameterized<any>

export type Design = {
  meta: DesignMeta
  assembly: DesignAssembly
}

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
