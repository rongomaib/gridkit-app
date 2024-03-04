import { autocompletion } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { basicSetup } from 'codemirror'
import {
  tsAutocompleteWorker,
  tsFacetWorker,
  tsHoverWorker,
  tsLinterWorker,
  tsSyncWorker,
} from '@valtown/codemirror-ts'
import { type WorkerShape } from '@valtown/codemirror-ts/worker'

import * as Comlink from 'comlink'

export async function getTypeScriptExtensions() {
  const innerWorker = new Worker(
    new URL(
      './workers/typescript.ts',
      // @ts-ignore
      import.meta.url,
    ),
    {
      type: 'module',
    },
  )
  const worker = Comlink.wrap(innerWorker) as WorkerShape

  await worker.initialize()

  const path = 'index.ts'

  return [
    basicSetup,
    javascript({
      typescript: true,
      jsx: false,
    }),
    tsFacetWorker.of({ worker, path }),
    tsSyncWorker(),
    tsLinterWorker(),
    autocompletion({
      override: [tsAutocompleteWorker()],
    }),
    tsHoverWorker(),
  ]
}
