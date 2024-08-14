import '@villagekit/part-gridpanel'
import '@villagekit/part-gridpanel/creator'
import '@villagekit/part-gridbeam'
import '@villagekit/part-gridbeam/creator'
import '@villagekit/part-fastener'
import '@villagekit/part-fastener/creator'

import type { PartCreator, WithRequiredId } from '@villagekit/part'

import { deserializeCreator, serializeCreator } from '@villagekit/part/creator'
import { generateFastenerParts } from './lib'

export interface WorkerRequestData {
  requestId: number
  partObjects: Array<any>
}

export interface WorkerResponseData {
  requestId: number
  newPartObjects: Array<any>
}

self.addEventListener('message', (ev) => {
  const request = ev.data as WorkerRequestData
  const { requestId, partObjects } = request
  const partCreators = partObjects.map(deserializeCreator)
  const newPartCreators: Array<WithRequiredId<PartCreator>> = generateFastenerParts(partCreators)
  const newPartObjects = newPartCreators.map(serializeCreator)
  const response: WorkerResponseData = { newPartObjects, requestId }
  self.postMessage(response)
})
