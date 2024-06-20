import '@villagekit/part-gridpanel'
import '@villagekit/part-gridbeam'
import '@villagekit/part-fastener'

import type { PartCreator, PartState } from '@villagekit/part'

import { generateFastenerParts } from './lib'

export interface WorkerRequestData {
  requestId: number
  partStates: Array<PartState>
}

export interface WorkerResponseData {
  requestId: number
  newPartCreators: Array<PartCreator>
}

self.addEventListener('message', (ev) => {
  const request = ev.data as WorkerRequestData
  const { requestId, partStates } = request
  const newPartCreators = generateFastenerParts(partStates)
  const response: WorkerResponseData = { newPartCreators, requestId }
  self.postMessage(response)
})
