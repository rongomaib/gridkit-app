import '@villagekit/part-gridpanel/creator'
import '@villagekit/part-gridbeam/creator'
import '@villagekit/part-fastener/creator'

import type { PartCreator, WithRequiredId } from '@villagekit/part'
import { deserializeCreator, serializeCreator } from '@villagekit/part/creator'
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
  deferredsByRequest: Record<string, DeferredPromise<Array<WithRequiredId<PartCreator>>>>
}

export const SmartFastenerPlugin: Plugin<SmartFastenerPluginState> = {
  id: 'smart-fasteners',
  generateParts(
    partCreators: Array<WithRequiredId<PartCreator>>,
  ): Promise<Array<WithRequiredId<PartCreator>>> {
    if (this.state === null) return Promise.reject('Plugin not initialised!')

    const { state } = this
    const { worker, deferredsByRequest } = state
    const requestId = state.nextRequestId++

    const deferred = Deferred<Array<WithRequiredId<PartCreator>>>()
    deferredsByRequest[requestId] = deferred

    const partObjects = partCreators.map(serializeCreator)
    const request: WorkerRequestData = { partObjects, requestId }
    worker.postMessage(request)

    return deferred.promise
  },

  init() {
    if (this.state !== null) return
    const worker = new Worker(new URL('./worker', import.meta.url), {
      type: 'module',
    })
    const deferredsByRequest: Record<
      string,
      DeferredPromise<Array<WithRequiredId<PartCreator>>>
    > = {}
    const nextRequestId = 0

    worker.addEventListener('message', (ev) => {
      const response = ev.data as WorkerResponseData
      const { requestId, newPartObjects } = response

      const newPartCreators = newPartObjects.map(deserializeCreator) as Array<
        WithRequiredId<PartCreator>
      >

      const deferred = deferredsByRequest[requestId]!
      delete deferredsByRequest[requestId]

      deferred.resolve(newPartCreators)
    })

    this.state = { deferredsByRequest, nextRequestId, worker }
  },

  state: null,
}

registerPlugin(SmartFastenerPlugin)
