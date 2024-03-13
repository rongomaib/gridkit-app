import { client } from '@/client'
import { SandboxProvider, DesignFile } from '@villagekit/sandbox'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useEditorContext } from './editor'

type ProviderProps = {
  children: React.ReactNode
}

export interface ProductOptions {
  productPath: string
}

type ProductState = null | {
  file: DesignFile
}

function useProduct(options: ProductOptions): ProductState {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })

  const productEntryQuery = client.getProductEntry.useQuery(
    { productEntryPath: productMetaQuery.isSuccess ? productMetaQuery.data.entry : '' },
    { enabled: productMetaQuery.isSuccess },
  )

  const { code: editorCode, setCodeToLoad: setEditorCode } = useEditorContext()

  useEffect(() => {
    if (!productEntryQuery.isSuccess) return
    setEditorCode(productEntryQuery.data)
  }, [productEntryQuery.isSuccess, productEntryQuery.data, setEditorCode])

  return useMemo(() => {
    if (!productMetaQuery.isSuccess) return null
    const { type, entry } = productMetaQuery.data

    const language = entry.endsWith('.ts')
      ? 'typescript'
      : entry.endsWith('.js')
      ? 'javascript'
      : 'unknown'

    if (language === 'unknown') throw new Error(`Unexpected product entry extension: ${entry}`)

    return {
      file: {
        type,
        code: editorCode,
        language,
      },
    }
  }, [productMetaQuery.isSuccess, productMetaQuery.data, editorCode])
}

export const ProductContext = createContext<ProductState | null>(null)

export function useProductContext() {
  return useContext(ProductContext)
}

export function ProductProvider(props: ProductOptions & ProviderProps) {
  const { children, ...options } = props

  const product = useProduct(options)

  const sandbox =
    product == null ? children : <SandboxProvider file={product.file}>{children}</SandboxProvider>

  return <ProductContext.Provider value={product}>{sandbox}</ProductContext.Provider>
}
