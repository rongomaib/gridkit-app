import type { FastenerState } from './types'

export type FastenerCreator = FastenerState

export function calculateState(creator: FastenerCreator): FastenerState {
  return creator
}
