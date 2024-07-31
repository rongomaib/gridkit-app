import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { createWorker } from '@valtown/codemirror-ts/worker'
import * as Comlink from 'comlink'
import ts from 'typescript'

Comlink.expose(
  createWorker(async () => {
    const fsMap = await createDefaultMapFromCDN(
      { target: ts.ScriptTarget.ES2022 },
      ts.version,
      false,
      ts,
    )
    fsMap.set(
      '/node_modules/@villagekit/design/kit.d.ts',
      // @ts-ignore
      (await import('@villagekit/design/type-bundles/kit.d.ts?raw')).default,
    )
    fsMap.set(
      '/node_modules/@villagekit/part-gridbeam/creator.d.ts',
      // @ts-ignore
      // NOTE (mw): why?
      (await import('../../../../../parts/gridbeam/dist-type-bundles/creator.d.ts?raw')).default,
    )
    fsMap.set(
      '/node_modules/@villagekit/part-gridpanel/creator.d.ts',
      // @ts-ignore
      // NOTE (mw): why?
      (await import('../../../../../parts/gridpanel/dist-type-bundles/creator.d.ts?raw')).default,
    )
    fsMap.set(
      '/node_modules/@villagekit/part-fastener/creator.d.ts',
      // @ts-ignore
      // NOTE (mw): why?
      (await import('../../../../../parts/fastener/dist-type-bundles/creator.d.ts?raw')).default,
    )
    const system = createSystem(fsMap)
    const compilerOpts = {}
    return createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts)
  }),
)
