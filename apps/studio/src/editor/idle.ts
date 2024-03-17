import { type Extension, Facet, combineConfig } from '@codemirror/state'
import { type EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'

export type IdleListener = (view: EditorView) => void

interface IdleConfig {
  delay?: number
  needsRefresh?: null | ((update: ViewUpdate) => boolean)
}

const idlePlugin = ViewPlugin.fromClass(
  class {
    idleTime: number
    timeout: ReturnType<typeof setTimeout> | undefined = undefined
    set = true

    constructor(readonly view: EditorView) {
      const { delay } = view.state.facet(idleConfig)
      this.idleTime = Date.now() + delay
      this.run = this.run.bind(this)
      this.timeout = setTimeout(this.run, delay)
    }

    run() {
      const now = Date.now()
      if (now < this.idleTime - 10) {
        this.timeout = setTimeout(this.run, this.idleTime - now)
      } else {
        this.set = false
        const { listeners } = this.view.state.facet(idleConfig)
        for (const listener of listeners) {
          listener(this.view)
        }
      }
    }

    update(update: ViewUpdate) {
      const config = update.state.facet(idleConfig)
      if (
        update.docChanged ||
        config !== update.startState.facet(idleConfig) ||
        config.needsRefresh?.(update)
      ) {
        this.idleTime = Date.now() + config.delay
        if (!this.set) {
          this.set = true
          this.timeout = setTimeout(this.run, config.delay)
        }
      }
    }

    force() {
      if (this.set) {
        this.idleTime = Date.now()
        this.run()
      }
    }

    destroy() {
      clearTimeout(this.timeout)
    }
  },
)

export function createIdler(listener: IdleListener, config: IdleConfig = {}): Extension {
  return [idleConfig.of({ listener, config }), idlePlugin]
}

export function forceIdle(view: EditorView) {
  const plugin = view.plugin(idlePlugin)
  if (plugin) plugin.force()
}

const idleConfig = Facet.define<
  { listener: IdleListener; config: IdleConfig },
  Required<IdleConfig> & { listeners: readonly IdleListener[] }
>({
  combine(input) {
    return {
      listeners: input.map((i) => i.listener),
      ...combineConfig(
        input.map((i) => i.config),
        {
          delay: 750,
          needsRefresh: null,
        },
        {
          needsRefresh: (a, b) => (!a ? b : !b ? a : (u) => a(u) || b(u)),
        },
      ),
    }
  },
})
