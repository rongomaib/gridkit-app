import { useLoader } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { NearestFilter, RepeatWrapping, type Texture, TextureLoader } from 'three'

export * from './context/index'
export * from './svg/index'

export type PartId = string
export type PartType = string
export type PartCreatorType = string
export type PartVariantId = string

export interface PartMaterial {
  textureUrl: string
}
export interface PartMaterials {
  [key: string]: PartMaterial
}

export interface PartVariant {
  id: string
  materials: PartMaterials
}

export interface BasePartState {
  id: PartId
  type: PartType
  variant: PartVariant
}

export interface BasePartCreator {
  id?: PartId
  type: PartCreatorType
  variant?: PartVariantId
}

export interface BasePartSummaryValue {
  type: PartType
}

export interface PartsGlProps<PartGlValue> {
  parts: Array<PartGlValue>
}

export type PartSummaryEntry<T extends BasePartSummaryValue> = [string, T]

export type PartSummaryQuotaSingle<T extends BasePartSummaryValue> = {
  type: 'single'
  key: string
  part: T
}

export type PartSummaryQuotaGrouped<T extends BasePartSummaryValue> = {
  type: 'grouped'
  key: string
  part: T
  count: number
}

export type PartSummaryQuota<T extends BasePartSummaryValue> =
  | PartSummaryQuotaSingle<T>
  | PartSummaryQuotaGrouped<T>

export interface PartsSummaryProps<T extends BasePartSummaryValue> {
  parts: Array<T>
}

interface UseTextureOptions {
  repeat: [number, number]
}

export function useTexture(
  partMaterial: PartMaterial,
  options: UseTextureOptions = { repeat: [1, 1] },
): Texture {
  const texture = useLoader(TextureLoader, partMaterial.textureUrl)

  useLayoutEffect(() => {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.needsUpdate = true
    texture.magFilter = NearestFilter
    texture.anisotropy = 16

    // TODO (mw): use mesh uvs instead of this
    // https://discourse.threejs.org/t/use-the-same-texture-with-different-offsets-on-different-materials/19270/11
    texture.repeat.set(...options.repeat)
  }, [texture, options])

  return texture
}

export function partsToPartQuotas<T extends BasePartSummaryValue>(
  type: PartSummaryQuota<T>['type'],
  entries: Array<PartSummaryEntry<T>>,
): Array<PartSummaryQuota<T>> {
  switch (type) {
    case 'single':
      return entries.map(([key, part]) => ({
        key,
        part,
        type: 'single' as const,
      }))
    case 'grouped':
      return Object.values(
        entries.reduce<Record<string, PartSummaryQuotaGrouped<T>>>((result, [key, part]) => {
          if (key in result) {
            const entry = result[key]
            if (entry != null && entry.count != null) {
              entry.count += 1
            }
          } else {
            result[key] = {
              count: 1,
              key,
              part,
              type: 'grouped',
            }
          }
          return result
        }, {}),
      )
  }
}
