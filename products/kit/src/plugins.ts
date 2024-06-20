import { type PartCreator, calculateStateForAll } from '@villagekit/part'
import { flatten } from 'lodash-es'

import type { Plugin } from './plugin'

type PluginsById = Record<string, Plugin>

const plugins: PluginsById = {}

export function registerPlugin<PluginState>(plugin: Plugin<PluginState>) {
  plugins[plugin.id] = plugin
}

export function getPlugin(pluginId: string): Plugin | undefined {
  return plugins[pluginId]
}

export async function generatePartsForPlugins(
  plugins: Array<Plugin>,
  partCreators: Array<PartCreator>,
): Promise<Array<PartCreator>> {
  const partStates = calculateStateForAll(partCreators)
  const pluginParts = await Promise.all(
    plugins.map((plugin) => {
      // NOTE: plugin functions must be called as methods,
      // not standalone functions, in order to maintain 'this'.
      if (plugin.init != null) plugin.init()
      return plugin.generateParts(partStates)
    }),
  )
  return flatten(pluginParts)
}
