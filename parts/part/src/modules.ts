import { BasePartSummaryValue } from '@villagekit/part-base'

import { PartCreator, PartModule, PartModulesByType, PartState, PartVariantsByType } from './types'

// @ts-ignore
export const partModules: PartModulesByType = {}

export function registerPartModule<
  Id extends PartState['type'],
  Creator extends PartCreator,
  State extends PartState,
  GlValue,
  SummaryValue extends BasePartSummaryValue,
  Variants,
>(partModule: PartModule<Id, Creator, State, GlValue, SummaryValue, Variants>) {
  // @ts-ignore
  partModules[partModule.id] = partModule
}

export function getPartModule<Id extends PartState['type']>(id: Id): PartModulesByType[Id] {
  const partModule = partModules[id]

  if (process.env.NODE_ENV !== 'production') {
    if (partModule == null) {
      throw new Error(`part module not found: ${id}`)
    }
  }

  return partModule
}

export function getPartModules(): PartModulesByType {
  return partModules
}

export function getPartVariants(): PartVariantsByType {
  const partVariantsByType: Partial<PartVariantsByType> = {}
  for (const partModule of Object.values(partModules)) {
    // @ts-ignore
    partVariantsByType[partModule.id] = partModule.variants
  }
  return partVariantsByType as PartVariantsByType
}
