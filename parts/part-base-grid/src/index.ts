import { BasePartState, PartVariant } from '@villagekit/part-base'
import { Length } from '@villagekit/util-units'

export * from './svg'

export interface PartGridVariant extends PartVariant {
  gridLength: Length
}

export interface BaseGridPartState extends BasePartState {
  variant: PartGridVariant
}
