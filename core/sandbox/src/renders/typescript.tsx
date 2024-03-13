import initSwc, { type Output as TransformOutput, transformSync } from '@swc/wasm-web'
import { type ActorRefFrom, fromCallback } from 'xstate'
import type { RenderInputEvent } from './'
import type { javascriptAssemblyRenderer } from './javascript'

export const typescriptAssemblyRenderer = fromCallback<
  RenderInputEvent,
  { javascriptAssemblyRenderer: ActorRefFrom<typeof javascriptAssemblyRenderer> }
>(({ input, sendBack, receive }) => {
  const { javascriptAssemblyRenderer } = input

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
      sendBack({
        type: 'renderer.failure',
        renderError: {
          type: 'typescript.transform',
          error: error,
        },
      })
      return
    }

    javascriptAssemblyRenderer.send({
      type: 'render',
      code: tsTransformOutput.code,
    })
  }
})
