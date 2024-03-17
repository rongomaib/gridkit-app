import initSwc, { type Output as TransformOutput, transformSync } from '@swc/wasm-web'
import { type ActorRefFrom, fromCallback } from 'xstate'
import type { RenderEvent, RendererMachineEvent } from './'
import type { javascriptRenderer } from './javascript'

export const typescriptRenderer = fromCallback<
  RenderEvent,
  { javascriptRenderer: ActorRefFrom<typeof javascriptRenderer> }
>(({ input, sendBack, receive }) => {
  const { javascriptRenderer } = input

  const swcInitialized = initSwc()

  receive((event) => {
    handleCode(event.code)
  })

  return () => {}

  async function handleCode(tsCode: string) {
    await swcInitialized

    let tsTransformOutput: TransformOutput
    try {
      tsTransformOutput = transformSync(tsCode, {
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
