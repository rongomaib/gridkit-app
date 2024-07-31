import '@villagekit/part-gridpanel'
import '@villagekit/part-gridbeam'
import '@villagekit/part-fastener'

import type { PartCreator, WithRequiredId } from '@villagekit/part'

import { generateFastenerParts } from './lib'

export interface WorkerRequestData {
  requestId: number
  partCreators: Array<WithRequiredId<PartCreator>>
}

export interface WorkerResponseData {
  requestId: number
  newPartCreators: Array<WithRequiredId<PartCreator>>
}

self.addEventListener('message', (ev) => {
  const request = ev.data as WorkerRequestData
  const { requestId, partCreators } = request
  const newPartCreators = generateFastenerParts(partCreators)
  const response: WorkerResponseData = { newPartCreators, requestId }
  self.postMessage(response)
})
