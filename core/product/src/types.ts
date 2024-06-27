import type { SandboxProps } from '@villagekit/sandbox'
import type { FunctionComponent, PropsWithChildren } from 'react'
import type { z } from 'zod'
import type { productMetaSchema } from './schema'

export type ProductMeta = z.infer<typeof productMetaSchema>

export type ProductData = {
  meta: ProductMeta
  code: string
}

export type ProductTypeProviderProps = PropsWithChildren<{}>
export type ProductViewProps = Omit<SandboxProps, 'label' | 'boundingBox' | 'bridgeContexts'> & {}
export type ProductSummaryProps = {
  displayUnit: 'gu' | 'mm'
  groupParts: boolean
}
export type ProductInfoProps = {
  containerRef?: React.RefObject<HTMLDivElement>
}

export type ProductModule = {
  id: string
  components: {
    ProductProvider: FunctionComponent<ProductTypeProviderProps>
    ProductView: FunctionComponent<ProductViewProps>
    ProductSummary: FunctionComponent<ProductSummaryProps>
    ProductInfo: FunctionComponent<ProductInfoProps>
  }
}
