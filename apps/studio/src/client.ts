import { useState, useEffect, useCallback } from 'react'
import { get, set } from 'idb-keyval'
import { parse } from 'smol-toml'
import type { ProductMeta } from '@villagekit/product'
import type { ProductIndex } from './context/workspace'
import type { Workspace } from './context/workspaces'

export type UseQueryOptions<TResult, TError = Error> = {
  enabled?: boolean
}
type ExtendedQueryOptions<TResult> = UseQueryOptions<TResult, Error>

export type UseMutationOptions<TResult, TError = Error, TVariables = void> = {
  onSuccess?: (data: TResult) => void | Promise<void>
}

export function useQuery<TResult>(options: {
  queryKey: any[]
  queryFn: () => Promise<TResult>
  enabled?: boolean
}) {
  const { queryKey, queryFn, enabled = true } = options
  const [data, setData] = useState<TResult | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [trigger, setTrigger] = useState(0)

  const queryKeyStr = JSON.stringify(queryKey)

  useEffect(() => {
    const handleInvalidate = (e: Event) => {
      const customEvent = e as CustomEvent
      const keysToInvalidate = customEvent.detail?.queryKey
      if (Array.isArray(keysToInvalidate)) {
        const match = keysToInvalidate.every((k, idx) => queryKey[idx] === k)
        if (match) {
          setTrigger((t) => t + 1)
        }
      }
    }
    window.addEventListener('invalidate-query', handleInvalidate)
    return () => window.removeEventListener('invalidate-query', handleInvalidate)
  }, [queryKeyStr])

  useEffect(() => {
    if (!enabled) return

    let active = true
    setIsLoading(true)

    queryFn()
      .then((res) => {
        if (!active) return
        setData(res)
        setIsSuccess(true)
        setIsLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        setError(err)
        setIsLoading(false)
        setIsSuccess(false)
      })

    return () => {
      active = false
    }
  }, [queryKeyStr, enabled, trigger])

  return { data, isLoading, isSuccess, error }
}

export function useMutation<TResult, TError = Error, TVariables = void>(options: {
  mutationFn: (variables: TVariables) => Promise<TResult>
  onSuccess?: (data: TResult) => void | Promise<void>
}) {
  const { mutationFn, onSuccess } = options
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<TError | null>(null)

  const mutate = useCallback((variables: TVariables) => {
    setIsLoading(true)
    setIsSuccess(false)
    mutationFn(variables)
      .then((res) => {
        setIsSuccess(true)
        setIsLoading(false)
        setError(null)
        if (onSuccess) {
          void onSuccess(res)
        }
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
        setIsSuccess(false)
      })
  }, [mutationFn, onSuccess])

  return { mutate, isLoading, isSuccess, error }
}

export function useQueryClient() {
  return {
    invalidateQueries: (options: { queryKey: any[] }) => {
      window.dispatchEvent(new CustomEvent('invalidate-query', { detail: { queryKey: options.queryKey } }))
    }
  }
}

const WORKSPACES_STORE_KEY = 'gridkit-workspaces'

export type ListWorkspacesArgs = {}
export type ListWorkspacesResult = Array<Workspace>
export function useListWorkspacesQuery(options?: ExtendedQueryOptions<ListWorkspacesResult>) {
  return useQuery({
    queryKey: ['list_workspaces'],
    queryFn: async () => {
      const handles = await get<any[]>(WORKSPACES_STORE_KEY)
      if (!handles) return []
      return handles.map((handle) => ({ path: handle.name, handle }))
    },
    ...options,
  })
}

export type OpenWorkspaceArgs = {}
export type OpenWorkspaceResult = string | null
export function useOpenWorkspaceMutation(
  options: UseMutationOptions<OpenWorkspaceResult, Error, OpenWorkspaceArgs>,
) {
  return useMutation<OpenWorkspaceResult, Error, OpenWorkspaceArgs>({
    mutationFn: async () => {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        })
        const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
        const filtered = handles.filter((h) => h.name !== directoryHandle.name)
        filtered.push(directoryHandle)
        await set(WORKSPACES_STORE_KEY, filtered)
        return directoryHandle.name
      } catch (err) {
        return null
      }
    },
    ...options,
  })
}

export type AddWorkspaceArgs = { workspace: Workspace }
export function useAddWorkspaceMutation(
  options: UseMutationOptions<void, Error, AddWorkspaceArgs>,
) {
  return useMutation<void, Error, AddWorkspaceArgs>({
    mutationFn: async () => {
       // Handled directly in useOpenWorkspaceMutation for PWA
    },
    ...options,
  })
}

export type RemoveWorkspaceArgs = { workspacePath: string }
export function useRemoveWorkspaceMutation(
  options: UseMutationOptions<void, Error, RemoveWorkspaceArgs>,
) {
  return useMutation<void, Error, RemoveWorkspaceArgs>({
    mutationFn: async ({ workspacePath }) => {
      const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
      const filtered = handles.filter((h) => h.name !== workspacePath)
      await set(WORKSPACES_STORE_KEY, filtered)
    },
    ...options,
  })
}

export type ListProductsArgs = {
  workspacePath: string
}
export type ListProductsResult = Array<ProductIndex>
export function useListProductsQuery(
  args: ListProductsArgs,
  options?: ExtendedQueryOptions<ListProductsResult>,
) {
  return useQuery({
    queryKey: ['list_products', args],
    queryFn: async () => {
      if (!args.workspacePath) return []
      const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
      const handle = handles.find((h) => h.name === args.workspacePath)
      if (!handle) throw new Error('Workspace not found')

      if ((await handle.queryPermission({ mode: 'read' })) !== 'granted') {
        if ((await handle.requestPermission({ mode: 'read' })) !== 'granted') {
          return []
        }
      }

      try {
        const productsDir = await handle.getDirectoryHandle('products')
        const productIndexes: ProductIndex[] = []
        for await (const [name, entry] of (productsDir as any).entries()) {
          if (entry.kind === 'directory') {
            productIndexes.push({ id: name, path: name })
          }
        }
        return productIndexes
      } catch (e) {
        return []
      }
    },
    ...options,
  })
}

export type GetProductMetaArgs = {
  workspacePath: string
  productPath: string
}
export type GetProductMetaResult = ProductMeta
export function useGetProductMetaQuery(
  args: GetProductMetaArgs,
  options?: ExtendedQueryOptions<GetProductMetaResult>,
) {
  return useQuery({
    queryKey: ['get_product_meta', args],
    queryFn: async () => {
      if (!args.workspacePath || !args.productPath) throw new Error('Missing args')
      const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
      const handle = handles.find((h) => h.name === args.workspacePath)
      if (!handle) throw new Error('Workspace not found')

      const productsDir = await handle.getDirectoryHandle('products')
      const productDir = await productsDir.getDirectoryHandle(args.productPath)
      let fileHandle
      try {
        fileHandle = await productDir.getFileHandle('villagekit.toml')
      } catch (err) {
        console.error(`Failed to get villagekit.toml for product: "${args.productPath}"`, err)
        throw err
      }
      const file = await fileHandle.getFile()
      const text = await file.text()
      const parsed = parse(text) as any
      return {
        type: parsed.product.type || 'kit',
        name: parsed.product.name || args.productPath,
        id: args.productPath,
        label: parsed.product.label || args.productPath,
        description: parsed.product.description || '',
        exports: parsed.product.exports,
      } as unknown as ProductMeta
    },
    ...options,
  })
}

export type GetProductFileArgs = {
  workspacePath: string
  productPath: string
  fileName: string
}
export type GetProductFileResult = string
export function useGetProductFileQuery(
  args: GetProductFileArgs,
  options?: ExtendedQueryOptions<GetProductFileResult>,
) {
  return useQuery({
    queryKey: ['get_product_file', args],
    queryFn: async () => {
      if (!args.workspacePath || !args.productPath || !args.fileName) throw new Error('Missing args')
      const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
      const handle = handles.find((h) => h.name === args.workspacePath)
      if (!handle) throw new Error('Workspace not found')

      const productsDir = await handle.getDirectoryHandle('products')
      const productDir = await productsDir.getDirectoryHandle(args.productPath)
      
      const cleanName = args.fileName.replace(/^\.\//, '').trim()
      const parts = cleanName.split('/').filter(Boolean)
      if (parts.length === 0) throw new Error(`Resolved file name is empty for args.fileName: "${args.fileName}"`)
      const fileName = parts.pop()!
      let currentDir = productDir
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
      
      let fileHandle
      try {
        fileHandle = await currentDir.getFileHandle(fileName)
      } catch (err) {
        console.error(`Failed to get file handle for fileName: "${fileName}", original args.fileName: "${args.fileName}"`, err)
        throw err
      }
      const file = await fileHandle.getFile()
      const text = await file.text()
      return text
    },
    ...options,
  })
}

export type UpdateProductFileArgs = {
  workspacePath: string
  productPath: string
  fileName: string
  content: string
}
export function useUpdateProductFileMutation(
  options?: UseMutationOptions<void, Error, UpdateProductFileArgs>,
) {
  return useMutation<void, Error, UpdateProductFileArgs>({
    mutationFn: async (args) => {
      if (!args.workspacePath || !args.productPath || !args.fileName) throw new Error('Missing args')
      const handles = (await get<any[]>(WORKSPACES_STORE_KEY)) || []
      const handle = handles.find((h) => h.name === args.workspacePath)
      if (!handle) throw new Error('Workspace not found')

      const productsDir = await handle.getDirectoryHandle('products')
      const productDir = await productsDir.getDirectoryHandle(args.productPath)
      
      const cleanName = args.fileName.replace(/^\.\//, '').trim()
      const parts = cleanName.split('/').filter(Boolean)
      if (parts.length === 0) throw new Error(`Resolved file name is empty for args.fileName: "${args.fileName}"`)
      const fileName = parts.pop()!
      let currentDir = productDir
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
      
      let fileHandle
      try {
        fileHandle = await currentDir.getFileHandle(fileName, { create: true })
      } catch (err) {
        console.error(`Failed to get file handle for saving: "${fileName}"`, err)
        throw err
      }
      
      const writable = await (fileHandle as any).createWritable()
      await writable.write(args.content)
      await writable.close()
    },
    ...options,
  })
}
