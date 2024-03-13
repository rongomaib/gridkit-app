import { fromCallback } from 'xstate'
import { RenderInputEvent } from './'
import * as Comlink from 'comlink'
import { comlinkDataUrl } from '../comlink'
import {
  DesignMeta,
  DesignParameters,
  DesignParts,
  DesignPresets,
  DesignParametersValues,
  DesignPartVariantsByType,
} from '@villagekit/design'
import { AnyMap, TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { parseStackTrace } from 'errorstacks'

type AssemblyEvaluator = {
  loadModule: (code: string) => Promise<string>
  evaluateModule: () => Promise<{
    meta: DesignMeta
    parameters: DesignParameters | null
    presets: DesignPresets<any> | null
    assembly: DesignParts | null
  }>
  evaluateAssembly: (
    parameters: DesignParametersValues,
    partVariants: DesignPartVariantsByType,
  ) => Promise<DesignParts>
}

export const javascriptAssemblyRenderer = fromCallback<RenderInputEvent>(
  ({ sendBack, receive }) => {
    const evaluatorIframe = createEvaulatorIframe()
    document.body.appendChild(evaluatorIframe)

    const evaluator = Comlink.wrap<AssemblyEvaluator>(
      Comlink.windowEndpoint(evaluatorIframe.contentWindow!),
    )
    const hasLoadedEvaluator = new Promise((resolve) => {
      evaluatorIframe.onload = resolve
    })

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      evaluator[Comlink.releaseProxy]()
      document.body.removeChild(evaluatorIframe)
    }

    async function handleCode(jsCode: string) {
      await hasLoadedEvaluator

      const traceMap = getTraceMap(jsCode)

      const moduleUrl = await evaluator.loadModule(jsCode)

      let jsModule
      try {
        jsModule = await evaluator.evaluateModule()
      } catch (error) {
        sendEvaluationError(error)
        return
      }

      if (jsModule == null) return

      const { meta, parameters, presets } = jsModule

      sendBack({
        type: 'renderer.success',
        render: {
          type: 'assembly' as const,
          meta,
          parameters,
          presets,
          assembly: async (
            parameters: DesignParametersValues,
            partVariants: DesignPartVariantsByType,
          ) => {
            try {
              return await evaluator.evaluateAssembly(parameters, partVariants)
            } catch (error) {
              sendEvaluationError(error)
              return []
            }
          },
        },
      })

      function sendEvaluationError(error: unknown) {
        console.error('error', error)
        const tracedError =
          error instanceof Error
            ? traceError(error, moduleUrl, traceMap)
            : { message: String(error), stack: [] }
        sendBack({
          type: 'renderer.failure',
          renderError: {
            type: 'javascript.evaluate',
            error: tracedError,
          },
        })
      }
    }
  },
)

const createEvaulatorIframe = () => {
  const iframe = document.createElement('iframe')
  iframe.title = 'Village Kit Evaluator'
  iframe.sandbox.add('allow-scripts')
  iframe.sandbox.add('allow-same-origin')
  iframe.style.display = 'none'
  iframe.srcdoc = createEvaluatorIframeSrc()
  return iframe
}

const createEvaulatorWorkerSrc = () => `
  // web workers don't yet support importmaps
  import * as Comlink from "${comlinkDataUrl}"

  let moduleUrl = null
  let module = null

  function loadModule(code) {
    if (moduleUrl != null) {
      URL.revokeObjectURL(moduleUrl)
    }

    moduleUrl = URL.createObjectURL(
      new Blob([code], { type: 'text/javascript' }),
    )

    return moduleUrl
  }

  async function evaluateModule() {
    module = await import(moduleUrl)

    const { meta, parameters, presets, assembly } = module

    return {
      meta,
      parameters,
      presets,
    }
  }

  function evaluateAssembly(parameters, partVariants) {
    return typeof module.assembly === 'function'
      ? module.assembly(parameters, partVariants)
      : module.assembly
  }

  const exports = {
    loadModule,
    evaluateModule,
    evaluateAssembly,
  }

  Comlink.expose(exports)
`

const createEvaluatorIframeSrc = () =>
  `
<!doctype html>
<script type="importmap">
{
  "imports": {
    "comlink": "${comlinkDataUrl}",
    "@villagekit/design": "data:,${encodeURI('')}"
  }
}
</script>
<script type="module">
  import * as Comlink from "comlink"

  const workerCode = \`${createEvaulatorWorkerSrc()}\`
  const workerUrl = URL.createObjectURL(
    new Blob([workerCode], { type: 'text/javascript' })
  )
  const workerObj = new Worker(workerUrl, { type: 'module' })
  const worker = Comlink.wrap(workerObj)

  Comlink.expose(worker, Comlink.windowEndpoint(self.parent))
</script>
</html>
`

function getTraceMap(code: string) {
  const sourceMapLine = code.substring(code.lastIndexOf('\n', code.length - 1) + 1, code.length)
  const sourceMapData = sourceMapLine.substring(sourceMapLine.indexOf(',') + 1)
  const sourceMapContent = atob(sourceMapData)
  const traceMap = new AnyMap(sourceMapContent)
  return traceMap
}

function traceError(error: Error, moduleUrl: string, traceMap: TraceMap) {
  const message = error.message

  if (error.stack == null) {
    return { message, stack: [] }
  }

  let stack = parseStackTrace(error.stack)

  const lastStackIndex = stack.findIndex((frame) => frame.fileName === moduleUrl)
  if (lastStackIndex !== -1) {
    stack = stack.slice(0, lastStackIndex + 1)
  }

  const tracedStack = stack.map((frame) => {
    const { name, line, column } = frame
    const originalPosition = originalPositionFor(traceMap, { line, column })
    return {
      name,
      line: originalPosition.line || line,
      column: originalPosition.column || column,
    }
  })

  return {
    message,
    stack: tracedStack,
  }
}
