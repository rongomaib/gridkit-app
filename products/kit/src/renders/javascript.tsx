import { AnyMap, type TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import * as Comlink from 'comlink'
import { parseStackTrace } from 'errorstacks'
import { fromCallback } from 'xstate'
import { comlinkDataUrl } from '../comlink'
import type { Params, ParamsValues, PartVariantsByType, Parts, Presets } from '../types'
import type { RenderEvent, RendererMachineEvent } from './'

type Evaluator = {
  loadModule: (code: string) => Promise<string>
  evaluateModule: () => Promise<{
    parameters: Params | null
    presets: Presets<any> | null
    parts: Parts | null
  }>
  evaluateParts: (paramsValues: ParamsValues, partVariants: PartVariantsByType) => Promise<Parts>
}

export const javascriptRenderer = fromCallback<RenderEvent, RendererMachineEvent>(
  ({ sendBack, receive }) => {
    const evaluatorIframe = createEvaulatorIframe()
    document.body.appendChild(evaluatorIframe)

    const evaluator = Comlink.wrap<Evaluator>(
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

      let jsModule: Awaited<ReturnType<Evaluator['evaluateModule']>>
      try {
        jsModule = await evaluator.evaluateModule()
      } catch (error) {
        sendEvaluationError(error)
        return
      }

      if (jsModule == null) return

      const { parameters, presets, parts } = jsModule

      const event: RendererMachineEvent =
        parameters == null || presets == null
          ? {
              type: 'renderer.success',
              render: {
                type: 'static',
                parts: parts != null ? parts : [],
              },
            }
          : {
              type: 'renderer.success',
              render: {
                type: 'parametric',
                parameters,
                presets,
                parts: async (paramsValues: ParamsValues, partVariants: PartVariantsByType) => {
                  try {
                    return await evaluator.evaluateParts(paramsValues, partVariants)
                  } catch (error) {
                    sendEvaluationError(error)
                    return []
                  }
                },
              },
            }
      sendBack(event)

      function sendEvaluationError(error: unknown) {
        console.error('error', error)
        const tracedError =
          error instanceof Error
            ? traceError(error, moduleUrl, traceMap)
            : { message: String(error), stack: [] }
        const event: RendererMachineEvent = {
          type: 'renderer.failure',
          renderError: {
            type: 'error:stack',
            title: 'JavaScript evaluation',
            ...tracedError,
          },
        }
        sendBack(event)
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

    const { parameters, presets, parts } = module

    if (typeof parts === 'function') {
      return {
        parameters,
        presets,
      }
    } else {
      return { parts }
    }
  }

  function evaluateParts(parameters, partVariants) {
    return module.parts(parameters, partVariants)
  }

  const exports = {
    loadModule,
    evaluateModule,
    evaluateParts,
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
