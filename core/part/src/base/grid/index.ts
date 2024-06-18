import type { Length } from '@villagekit/units'

import type { BasePartState, PartVariant } from '../'

export * from './svg/index'

export interface PartGridVariant extends PartVariant {
  gridLength: Length
}

export interface BaseGridPartState extends BasePartState {
  variant: PartGridVariant
}
