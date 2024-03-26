import type { BasePartState, PartVariant } from '@villagekit/part-base'
import type { Length } from '@villagekit/util-units'

export * from './svg/index'

export interface PartGridVariant extends PartVariant {
  gridLength: Length
}

export interface BaseGridPartState extends BasePartState {
  variant: PartGridVariant
}
