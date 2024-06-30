import type { InitOutput, Output as TransformOutput } from '@swc/wasm-web'
import { type ActorRefFrom, fromCallback } from 'xstate'
import type { RenderEvent, RendererMachineEvent } from './'
import type { javascriptRenderer } from './javascript'

export const typescriptRenderer = fromCallback<
  RenderEvent,
  { javascriptRenderer: ActorRefFrom<typeof javascriptRenderer> }
>(({ input, sendBack, receive }) => {
  const { javascriptRenderer } = input

  let swc: typeof import('@swc/wasm-web') | null = null
  let swcInitialized: Promise<InitOutput> | null = null

  receive((event) => {
    handleCode(event.code)
  })

  return () => {}

  async function handleCode(tsCode: string) {
    if (swc == null) {
      swc = await import('@swc/wasm-web')
      const { default: initSwc } = swc
      swcInitialized = initSwc()
    }

    await swcInitialized

    let tsTransformOutput: TransformOutput
    try {
      tsTransformOutput = swc.transformSync(tsCode, {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
        },
        module: {
          type: 'es6',
          strict: true,
          noInterop: true,
        },
        sourceMaps: 'inline',
      })
    } catch (error) {
      if (typeof error === 'string') {
        const event: RendererMachineEvent = {
          type: 'renderer.failure',
          renderError: {
            type: 'error:text',
            title: 'TypeScript transform',
            body: error,
          },
        }
        sendBack(event)
      } else {
        throw error
      }
      return
    }

    const event: RenderEvent = {
      type: 'render',
      code: tsTransformOutput.code,
    }
    javascriptRenderer.send(event)
  }
})
