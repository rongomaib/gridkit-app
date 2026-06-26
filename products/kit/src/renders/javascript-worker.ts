import '@villagekit/part-gridpanel/creator'
import '@villagekit/part-gridbeam/creator'
import '@villagekit/part-fastener/creator'
import '@villagekit/part-hinge/creator'
import '@villagekit/part-timber/creator'
import '@villagekit/part-beam120/creator'
import '@villagekit/part-panel-brace/creator'
import '@villagekit/part-wall-frame/creator'
import '@villagekit/part-gable-panel/creator'

import * as Comlink from 'comlink'
import { init as initModuleLexer, parse as parseModule } from 'es-module-lexer'

import { setComlinkTransferHandlers } from './javascript-comlink'

setComlinkTransferHandlers()

interface ImportMap {
  [moduleId: string]: string
}

async function loadImports(): Promise<ImportMap> {
  await initModuleLexer

  const modules1 = await Promise.all([
    // @ts-ignore
    import('../../node_modules/comlink/dist/esm/comlink.js?raw'),
    // @ts-ignore
    import('../../node_modules/three/build/three.module.js?raw'),
  ])
  const loaded1 = modules1.map((module) => loadImport(module.default))
  const [comlink, three] = loaded1

  const importMap2 = {
    comlink: comlink!,
    three: three!,
  }

  const modules2 = await Promise.all([
    // @ts-ignore
    import('../../../../util/math/dist/index.js?raw'),
    // @ts-ignore
    import('../../../../util/units/dist/index.js?raw'),
  ])
  const loaded2 = modules2.map((module) => loadImport(module.default, importMap2))
  const [math, units] = loaded2

  const importMap3 = {
    ...importMap2,
    '@villagekit/math': math!,
    '@villagekit/units': units!,
  }

  const modules3 = await Promise.all([
    // @ts-ignore
    import('../../../../core/part/dist/creator.js?raw'),
  ])
  const loaded3 = modules3.map((module) => loadImport(module.default, importMap3))
  const [partBase] = loaded3

  const importMap4 = {
    ...importMap3,
    '@villagekit/part/creator': partBase!,
  }

  const modules4 = await Promise.all([
    // @ts-ignore
    import('../../../../parts/gridbeam/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/gridpanel/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/fastener/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/hinge/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/timber/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/beam120/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/panel-brace/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/wall-frame/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/gable-panel/dist-bundles/creator.js?raw'),
  ])
  const loaded4 = modules4.map((module) => loadImport(module.default, importMap4))
  const [partGridbeam, partGridpanel, partFastener, partHinge, partTimber, partBeam120, partPanelBrace, partWallFrame, partGablePanel] = loaded4

  return {
    ...importMap4,
    '@villagekit/part-gridbeam/creator': partGridbeam!,
    '@villagekit/part-gridpanel/creator': partGridpanel!,
    '@villagekit/part-fastener/creator': partFastener!,
    '@villagekit/part-hinge/creator': partHinge!,
    '@villagekit/part-timber/creator': partTimber!,
    '@villagekit/part-beam120/creator': partBeam120!,
    '@villagekit/part-panel-brace/creator': partPanelBrace!,
    '@villagekit/part-wall-frame/creator': partWallFrame!,
    '@villagekit/part-gable-panel/creator': partGablePanel!,
    '@villagekit/design/kit': loadImport(''),
  }
}

const loadedImportMap = loadImports()

let modUrl: string | null = null
let mod: any = null

async function loadModule(code: string) {
  if (modUrl != null) {
    URL.revokeObjectURL(modUrl)
  }

  const nextCode = replaceImport(code, await loadedImportMap)
  modUrl = URL.createObjectURL(new Blob([nextCode], { type: 'text/javascript' }))

  return modUrl
}

async function evaluateModule() {
  if (modUrl == null) {
    throw new Error('Unexpected: Module not loaded')
  }

  mod = await import(
    /* @vite-ignore */
    /* webpackIgnore: true */
    modUrl
  )

  // wrap part function return values in type marker
  const parts =
    typeof mod.parts === 'function'
      ? (...args: Parameters<typeof mod.parts>) => {
          const value = mod.parts(...args)
          value.isParts = true
          return value
        }
      : mod.parts

  return {
    isModule: true,
    parameters: mod.parameters,
    presets: mod.presets,
    parts,
    plugins: mod.plugins,
  }
}

const exports = {
  loadModule,
  evaluateModule,
}

Comlink.expose(exports)

function loadImport(code: string, importMap?: ImportMap): string {
  const nextCode = importMap == null ? code : replaceImport(code, importMap)
  return URL.createObjectURL(new Blob([nextCode], { type: 'text/javascript' }))
}

function replaceImport(code: string, importMap: ImportMap): string {
  const [imports] = parseModule(code)

  if (imports.length === 0) return code

  const nextCode = []
  let lastEnd = 0
  for (const { s, e } of imports) {
    const start = s
    const end = e

    nextCode.push(code.slice(lastEnd, start))

    const moduleId = code.slice(start, end)
    const nextModuleId = importMap[moduleId]
    if (nextModuleId == null) {
      throw new Error(`Module ${moduleId} not found in importMap`)
    }
    nextCode.push(nextModuleId)

    lastEnd = end
  }

  nextCode.push(code.slice(lastEnd))

  return nextCode.join('')
}
