import { AnyMap, type TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import * as Comlink from 'comlink'
import { parseStackTrace } from 'errorstacks'
import { fromCallback } from 'xstate'
import type { Params, ParamsValues, PartVariantsByType, Parts, Presets } from '../types'
import type { RenderEvent, RendererMachineEvent } from './'

type Evaluator = {
  loadModule: (code: string) => Promise<string>
  evaluateModule: () => Promise<{
    parameters: Params | null
    presets: Presets<any> | null
    parts: Parts | null
    plugins: Array<string> | undefined
  }>
  evaluateParts: (paramsValues: ParamsValues, partVariants: PartVariantsByType) => Promise<Parts>
}

export const javascriptRenderer = fromCallback<RenderEvent, RendererMachineEvent>(
  ({ sendBack, receive }) => {
    const worker = new Worker(new URL('./javascript-worker', import.meta.url), { type: 'module' })
    worker.onerror = (error) => console.error('worker', error)
    worker.onmessageerror = (error) => console.error('worker', error)
    const evaluator = Comlink.wrap<Evaluator>(worker)

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      evaluator[Comlink.releaseProxy]()
      worker.terminate()
    }

    async function handleCode(jsCode: string) {
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

      const { parameters, presets, parts, plugins } = jsModule

      const event: RendererMachineEvent =
        parameters == null || presets == null
          ? {
              type: 'renderer.success',
              render: {
                type: 'static',
                parts: parts != null ? parts : [],
                plugins,
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
                plugins,
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
