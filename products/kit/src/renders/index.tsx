import {
  type ProductError,
  useProductCode,
  useProductMeta,
  useUpdateProductError,
} from '@villagekit/product'
import { useMachine } from '@xstate/react'
import { useEffect } from 'react'
import { type ActorRefFrom, assign, sendTo, setup } from 'xstate'
import type { ProductKitRender } from '../types'
import { javascriptRenderer } from './javascript'
import { typescriptRenderer } from './typescript'

export type RenderEvent = {
  type: 'render'
  code: string
}

export function useRender(): ProductKitRender<any> | null {
  const { exports: filePath } = useProductMeta()
  const code = useProductCode()

  const [state, send] = useMachine(rendererMachine)
  const { render, renderError } = state.context

  const language = filePath.endsWith('.ts')
    ? 'typescript'
    : filePath.endsWith('.js')
      ? 'javascript'
      : 'unknown'

  if (language === 'unknown') throw new Error(`Unexpected kit file path extension: ${filePath}`)

  useEffect(() => {
    console.log('[useRender] code changed, length:', code.length)
    switch (language) {
      case 'typescript':
        return send({ type: 'renderer.render.typescript', code })
      case 'javascript':
        return send({ type: 'renderer.render.javascript', code })
    }
  }, [send, language, code])

  const updateProductError = useUpdateProductError()
  useEffect(() => {
    if (renderError != null) {
      updateProductError(renderError)
    }
  }, [renderError, updateProductError])

  return render
}

export type RendererMachineContext = {
  rendererRefs:
    | null
    | [ActorRefFrom<typeof javascriptRenderer>, ActorRefFrom<typeof typescriptRenderer>]
  render: ProductKitRender<any> | null
  renderError: ProductError | null
}
export type RendererMachineEvent =
  | {
      type: 'renderer.render.javascript'
      code: string
    }
  | {
      type: 'renderer.render.typescript'
      code: string
    }
  | {
      type: 'renderer.success'
      render: ProductKitRender<any>
    }
  | {
      type: 'renderer.failure'
      renderError: ProductError
    }

export const rendererMachine = setup({
  types: {} as {
    context: RendererMachineContext
    events: RendererMachineEvent
  },
}).createMachine({
  id: 'kit-renderer',
  context: {
    rendererRefs: null,
    render: null,
    renderError: null,
  },
  entry: assign({
    // @ts-ignore — xstate v5 spawn types tighten too aggressively for our typed refs
    rendererRefs: ({ spawn }) => {
      // @ts-ignore
      const javascriptRendererRef = spawn(javascriptRenderer, {
        id: 'javascriptRenderer',
      })
      // @ts-ignore
      const typescriptRendererRef = spawn(typescriptRenderer, {
        id: 'typescriptRenderer',
        input: {
          javascriptRenderer: javascriptRendererRef,
        },
      })
      return [javascriptRendererRef, typescriptRendererRef]
    },
  }),
  on: {
    'renderer.render.javascript': {
      actions: sendTo('javascriptRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.render.typescript': {
      actions: sendTo('typescriptRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.success': {
      actions: assign({
        render: ({ event }) => event.render,
        renderError: null,
      }),
    },
    'renderer.failure': {
      actions: assign({
        renderError: ({ event }) => event.renderError,
      }),
    },
  },
})
