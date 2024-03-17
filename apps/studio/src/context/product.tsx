import { client } from '@/client'
import {
  ProductProvider as CoreProductProvider,
  type ProductMeta,
  type ProductModule,
} from '@villagekit/product'
import { ProductKit } from '@villagekit/product-kit'
import { type PropsWithChildren, useEffect } from 'react'
import { useEditorContext } from './editor'

export type ProductOptions = {
  productPath: string
}

type ProductEntry = null | {
  meta: ProductMeta
  code: string
}

const Products: Array<ProductModule> = [ProductKit]

export function ProductProvider(props: PropsWithChildren<ProductOptions>) {
  const { children, ...options } = props

  const entry = useProductEntry(options)

  if (entry == null) return children

  const { meta, code } = entry

  return (
    <CoreProductProvider Products={Products} meta={meta} code={code}>
      {children}
    </CoreProductProvider>
  )
}

function useProductEntry(options: ProductOptions): ProductEntry {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })

  const productExportsQuery = client.getProductFile.useQuery(
    {
      productPath,
      filePath: productMetaQuery.isSuccess ? productMetaQuery.data.exports : '',
    },
    { enabled: productMetaQuery.isSuccess },
  )

  const { code: editorCode, setCodeToLoad: setEditorCode } = useEditorContext()

  useEffect(() => {
    if (!productExportsQuery.isSuccess) return
    setEditorCode(productExportsQuery.data)
  }, [productExportsQuery.isSuccess, productExportsQuery.data, setEditorCode])

  if (!productMetaQuery.isSuccess) return null
  if (!productExportsQuery.isSuccess) return null

  return {
    meta: productMetaQuery.data,
    code: editorCode,
  }
}
