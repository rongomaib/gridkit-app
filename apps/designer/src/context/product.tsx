import { DesignAssembly, designAssemblySafeParse } from '@villagekit/design'
import { createContext, useContext, useEffect, useState } from 'react'
import initSwc, { transformSync } from '@swc/wasm-web'

import { client } from '@/client'
import type { ProductMeta } from '@/api'

import { useEditorContext } from './editor'

type ContextProviderProps = {
  children: React.ReactNode
}

export interface ProductOptions {
  productPath: string
}

type ProductMetaState = ProductMeta | null

function useProductMeta(options: ProductOptions): ProductMetaState {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })
  const productMeta = productMetaQuery.isSuccess ? productMetaQuery.data : null

  return productMeta
}

const ProductMetaContext = createContext<ProductMetaState>(null)

interface ProductAssemblyOptions {
  productAssemblyPath: string
}

type ProductAssemblyState = {
  file: ProductAssemblyFileState
  render: ProductAssemblyRenderState
}

interface ProductAssemblyFileState {
  type: 'typescript' | 'unknown'
  data: string | null
}

const ProductAssemblyFileContext = createContext<ProductAssemblyFileState | null>(null)

function useProductAssemblyFile(options: ProductAssemblyOptions): ProductAssemblyFileState {
  const { productAssemblyPath } = options

  const productAssemblyType = productAssemblyPath.endsWith('.ts') ? 'typescript' : 'unknown'

  const productAssemblyQuery = client.getProductAssembly.useQuery({ productAssemblyPath })
  const productAssemblyData = productAssemblyQuery.isSuccess ? productAssemblyQuery.data : null

  const { setCodeToLoad } = useEditorContext()

  useEffect(() => {
    setCodeToLoad(productAssemblyData)
  }, [setCodeToLoad, productAssemblyData])

  return {
    type: productAssemblyType,
    data: productAssemblyData,
  }
}

type ProductAssemblyRenderState =
  | {
      type: 'assembly'
      assembly: DesignAssembly
    }
  | {
      type: 'error'
      error: any
    }
  | null

const ProductAssemblyRenderContext = createContext<ProductAssemblyRenderState | null>(null)

interface ProductAssemblyRenderOptions {
  productAssemblyData: string
}

function useProductAssemblyTypeScript(
  _options: ProductAssemblyRenderOptions,
): ProductAssemblyRenderState {
  const [isSwcInitialized, setSwcInitialized] = useState(false)
  useEffect(() => {
    initSwc().then(() => setSwcInitialized(true))
  }, [])

  const { code: tsCode } = useEditorContext()

  const [assemblyRender, setAssemblyRender] = useState<ProductAssemblyRenderState>(null)

  useEffect(() => {
    if (!isSwcInitialized) return

    let jsCode
    try {
      const tsTransformOutput = transformSync(tsCode, {})
      jsCode = tsTransformOutput.code
    } catch (error) {
      setAssemblyRender({ type: 'error', error })
      return
    }
    ;(async () => {
      const jsCodeWithoutImports = jsCode.replace(
        /import (.*) from [\"\']@villagekit\/design[\"\']/,
        'const $1 = villagekit.design',
      )
      const jsModuleCode = `
        "use strict";

        const villagekit = {
          design: {
            DesignAssemblyParameterized: (design) => ({ type: 'parameterized', ...design })
          }
        }

        ${jsCodeWithoutImports}
      `

      let jsModule
      try {
        const jsModuleUrl = URL.createObjectURL(
          new Blob([jsModuleCode], { type: 'text/javascript' }),
        )
        jsModule = await import(/* @vite-ignore */ jsModuleUrl)
        URL.revokeObjectURL(jsModuleUrl)
      } catch (error) {
        setAssemblyRender({ type: 'error', error })
        return
      }

      // validate module
      if (jsModule.assembly == null) return
      const assemblyResult = designAssemblySafeParse(jsModule.assembly)

      if (assemblyResult == null) return
      if (assemblyResult.success) {
        // TODO: fix
        // @ts-ignore
        setAssemblyRender({ type: 'assembly', assembly: assemblyResult.data })
      } else {
        setAssemblyRender({ type: 'error', error: assemblyResult.error })
      }
    })()
  }, [isSwcInitialized, tsCode])

  return assemblyRender
}

// export helpers

function NullProductAssemblyProvider(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyFileContext.Provider value={null}>
      <ProductAssemblyRenderContext.Provider value={null}>
        {children}
      </ProductAssemblyRenderContext.Provider>
    </ProductAssemblyFileContext.Provider>
  )
}

function NullProductAssemblyRenderProvider(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyRenderContext.Provider value={null}>
      {children}
    </ProductAssemblyRenderContext.Provider>
  )
}

export function ProductProvider(props: ProductOptions & ContextProviderProps) {
  const { children, ...options } = props
  const meta = useProductMeta(options)

  if (meta == null)
    return (
      <ProductMetaContext.Provider value={null}>
        <NullProductAssemblyProvider>{children}</NullProductAssemblyProvider>
      </ProductMetaContext.Provider>
    )

  const { type, entry } = meta

  return (
    <ProductMetaContext.Provider value={meta}>
      {type === 'assembly' ? (
        <ProductAssemblyProvider productAssemblyPath={entry}>{children}</ProductAssemblyProvider>
      ) : (
        <NullProductAssemblyProvider>{children}</NullProductAssemblyProvider>
      )}
    </ProductMetaContext.Provider>
  )
}

function ProductAssemblyProvider(props: ProductAssemblyOptions & ContextProviderProps) {
  const { children, ...options } = props

  const file = useProductAssemblyFile(options)
  const { type, data } = file

  let inner = <NullProductAssemblyRenderProvider>{children}</NullProductAssemblyRenderProvider>
  if (data != null && type === 'typescript') {
    inner = (
      <ProductAssemblyTypeScriptProvider productAssemblyData={data}>
        {children}
      </ProductAssemblyTypeScriptProvider>
    )
  }

  return (
    <ProductAssemblyFileContext.Provider value={file}>{inner}</ProductAssemblyFileContext.Provider>
  )
}

function ProductAssemblyTypeScriptProvider(
  props: ProductAssemblyRenderOptions & ContextProviderProps,
) {
  const { children, ...options } = props
  const value = useProductAssemblyTypeScript(options)
  return (
    <ProductAssemblyRenderContext.Provider value={value}>
      {children}
    </ProductAssemblyRenderContext.Provider>
  )
}

export type ProductState = {
  meta: ProductMeta
  assembly: ProductAssemblyState | null
} | null

export function useProductContext(): ProductState {
  const meta = useContext(ProductMetaContext)
  const assembly = useProductAssemblyContext()

  if (meta == null) return null
  if (assembly == null) return null

  return {
    meta,
    assembly,
  }
}

function useProductAssemblyContext(): ProductAssemblyState | null {
  const file = useContext(ProductAssemblyFileContext)
  const render = useContext(ProductAssemblyRenderContext)

  if (file == null) return null

  return {
    file,
    render,
  }
}
