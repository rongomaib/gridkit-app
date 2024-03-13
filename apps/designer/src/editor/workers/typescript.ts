import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { createWorker } from '@valtown/codemirror-ts/worker'
import * as Comlink from 'comlink'
import ts from 'typescript'

// @ts-ignore
import typesDts from '../types.d.ts?raw'

Comlink.expose(
  createWorker(async () => {
    const fsMap = await createDefaultMapFromCDN(
      { target: ts.ScriptTarget.ES2022 },
      ts.version,
      false,
      ts,
    )
    fsMap.set('/node_modules/@villagekit/design/index.d.ts', typesDts)
    const system = createSystem(fsMap)
    const compilerOpts = {}
    return createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts)
  }),
)
