import { useLoader } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { NearestFilter, RepeatWrapping, type Texture, TextureLoader } from 'three'

export * from './context/index'
export * from './svg/index'

export type PartId = string
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

export interface PartsSummaryProps<T> {
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
