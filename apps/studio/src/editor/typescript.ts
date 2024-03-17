import { autocompletion } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import {
  tsAutocompleteWorker,
  tsFacetWorker,
  tsHoverWorker,
  tsLinterWorker,
  tsSyncWorker,
} from '@valtown/codemirror-ts'
import type { WorkerShape } from '@valtown/codemirror-ts/worker'
import { basicSetup } from 'codemirror'
import * as Comlink from 'comlink'

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
const worker = Comlink.wrap<WorkerShape>(innerWorker)

export async function getTypeScriptExtensions() {
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
