import { assign, sendTo, setup, ActorRefFrom } from 'xstate'
import { useEffect, useState } from 'react'
import { useMachine } from '@xstate/react'

import { DesignFile, DesignRender, DesignRenderError } from '../types'
import { javascriptAssemblyRenderer } from './javascript'
import { typescriptAssemblyRenderer } from './typescript'

export type RenderInputEvent = {
  type: 'render'
  code: string
}

export function useDesignRender(options: {
  file: DesignFile
}) {
  const { file } = options

  const [render, setRender] = useState<DesignRender<any>>(null)
  const [renderError, setRenderError] = useState<DesignRenderError>(null)

  const [state, send] = useMachine(rendererMachine)

  useEffect(() => {
    switch (file.type) {
      case 'assembly':
        switch (file.language) {
          case 'typescript':
            return send({ type: 'renderer.render.typescript', code: file.code })
          case 'javascript':
            return send({ type: 'renderer.render.javascript', code: file.code })
        }
    }
  }, [send, file])

  useEffect(() => {
    const { render, renderError } = state.context
    setRender(render)
    setRenderError(renderError)
  }, [state])

  return { render, renderError }
}

export const rendererMachine = setup({
  types: {} as {
    context: {
      rendererRefs:
        | null
        | [
            ActorRefFrom<typeof javascriptAssemblyRenderer>,
            ActorRefFrom<typeof typescriptAssemblyRenderer>,
          ]
      render: DesignRender<any>
      renderError: DesignRenderError
    }
    events:
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
          render: DesignRender<any>
        }
      | {
          type: 'renderer.failure'
          renderError: DesignRenderError
        }
  },
}).createMachine({
  id: 'renderer',
  context: {
    rendererRefs: null,
    render: null,
    renderError: null,
  },
  entry: assign({
    rendererRefs: ({ spawn }) => {
      // @ts-ignore
      const javascriptAssemblyRendererRef = spawn(javascriptAssemblyRenderer, {
        id: 'javascriptAssemblyRenderer',
      })
      // @ts-ignore
      const typescriptAssemblyRendererRef = spawn(typescriptAssemblyRenderer, {
        id: 'typescriptAssemblyRenderer',
        input: {
          javascriptAssemblyRenderer: javascriptAssemblyRendererRef,
        },
      })
      return [javascriptAssemblyRendererRef, typescriptAssemblyRendererRef]
    },
  }),
  on: {
    'renderer.render.javascript': {
      actions: sendTo('javascriptAssemblyRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.render.typescript': {
      actions: sendTo('typescriptAssemblyRenderer', ({ event }) => ({
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
