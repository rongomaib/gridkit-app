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

export type DesignParameters = ParametersOptions
export type DesignPresets<ParamsOptions extends ParametersOptions> = Presets<ParamsOptions>

export type DesignAssembly<ParamsOptions extends ParametersOptions = never> = (
  parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
  partVariants: PartVariantsByType,
) => DesignParts
export type DesignAssemblyPlugins = Array<AssemblyPlugin>

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
