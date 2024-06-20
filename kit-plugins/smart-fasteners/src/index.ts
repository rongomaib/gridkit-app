import type { PartCreator, PartState } from '@villagekit/part'
import { type Plugin, registerPlugin } from '@villagekit/product-kit'
import Deferred, { type DeferredPromise } from 'p-defer'
import type { WorkerRequestData, WorkerResponseData } from './worker'

export type { PossibleFastener } from './lib'

export type SmartFastenersPluginId = 'smart-fasteners'

declare global {
  namespace VK {
    export interface EveryPluginId {
      'smart-fasteners': 'smart-fasteners'
    }
  }
}

type SmartFastenerPluginState = null | {
  nextRequestId: number
  worker: Worker
  deferredsByRequest: Record<string, DeferredPromise<Array<PartCreator>>>
}

export const SmartFastenerPlugin: Plugin<SmartFastenerPluginState> = {
  id: 'smart-fasteners',
  generateParts(partStates: Array<PartState>): Promise<Array<PartCreator>> {
    if (this.state === null) return Promise.reject('Plugin not initialised!')

    const { state } = this
    const { worker, deferredsByRequest } = state
    const requestId = state.nextRequestId++

    const deferred = Deferred<Array<PartCreator>>()
    deferredsByRequest[requestId] = deferred

    const request: WorkerRequestData = { partStates, requestId }
    worker.postMessage(request)

    return deferred.promise
  },

  init() {
    if (this.state !== null) return

    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    })
    const deferredsByRequest: Record<string, DeferredPromise<Array<PartCreator>>> = {}
    const nextRequestId = 0

    worker.addEventListener('message', (ev) => {
      const response = ev.data as WorkerResponseData
      const { requestId, newPartCreators } = response

      const deferred = deferredsByRequest[requestId]!
      delete deferredsByRequest[requestId]

      deferred.resolve(newPartCreators)
    })

    this.state = { deferredsByRequest, nextRequestId, worker }
  },

  state: null,
}

registerPlugin(SmartFastenerPlugin)
