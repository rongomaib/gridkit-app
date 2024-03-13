import { type PartCreator, type PartState, calculateStateForAll } from '@villagekit/part'
import { flatten } from 'lodash-es'

export interface AssemblyPlugin<PluginState = unknown> {
  init?: () => void
  generateParts: (parts: Array<PartState>) => Promise<Array<PartCreator>>
  state: PluginState
}

export function generatePartsForPlugins(
  plugins: Array<AssemblyPlugin>,
  partCreators: Array<PartCreator>,
): Promise<Array<PartCreator>> {
  const partStates = calculateStateForAll(partCreators)
  return Promise.all(
    plugins.map((plugin) => {
      // NOTE: plugin functions must be called as methods,
      // not standalone functions, in order to maintain 'this'.
      if (plugin.init != null) plugin.init()
      return plugin.generateParts(partStates)
    }),
  ).then((pluginParts) => {
    return flatten(pluginParts)
  })
}
