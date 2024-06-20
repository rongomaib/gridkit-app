import type {
  ExtractValuesFromParams,
  Params,
  ParamsValues,
  Preset,
  Presets,
} from '@villagekit/parameters'
import type { PartCreator, PartVariantsByType } from '@villagekit/part'
import type { Plugin, PluginId } from './plugin'

export type ProductKit<Ps extends Params = never> = {
  parameters: Ps extends never ? null : Ps
  presets: Ps extends never ? null : Presets<Ps>
  parts: Ps extends never ? Parts : PartsFn<Ps>
}

export type Part = WithOptionalId<PartCreator>
export type Parts = RecursiveArray<Part | false | undefined | null>

export type { Params, Preset, Presets, ParamsValues, PartVariantsByType }

export type PartsFn<Ps extends Params> = (
  parameters: ExtractValuesFromParams<Ps>,
  partVariants: PartVariantsByType,
) => Parts

export type { Plugin }
export type Plugins = Array<Plugin>
export type PluginIds = Array<PluginId>

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}

/* render */

export type ProductKitRender<Ps extends Params = never> =
  | {
      type: 'static'
      parts: Parts
      plugins?: Array<string>
    }
  | {
      type: 'parametric'
      parameters: Ps
      presets: Presets<Ps>
      parts: (
        parameters: ExtractValuesFromParams<Ps>,
        partVariants: PartVariantsByType,
      ) => Promise<Parts>
      plugins?: Array<string>
    }
