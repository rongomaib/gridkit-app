import type { PartCreator, PartState } from '@villagekit/part'

declare global {
  namespace VK {
    export interface EveryPluginId {}
  }
}

// https://github.com/piotrwitek/utility-types/blob/master/src/utility-types.ts
type $Values<T extends object> = T[keyof T]

export type PluginId = $Values<VK.EveryPluginId>

export interface Plugin<PluginState = unknown> {
  id: PluginId
  init?: () => void
  generateParts: (parts: Array<PartState>) => Promise<Array<PartCreator>>
  state: PluginState
}
