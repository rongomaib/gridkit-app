import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { ProductMeta } from '@villagekit/product'
import type { ProductIndex } from './context/workspace'
import type { Workspace } from './context/workspaces'

type ExtendedQueryOptions<TResult> = Omit<UseQueryOptions<TResult, Error>, 'queryKey' | 'queryFn'>

export type ListWorkspacesArgs = {}
export type ListWorkspacesResult = Array<Workspace>
export function useListWorkspacesQuery(options?: ExtendedQueryOptions<ListWorkspacesResult>) {
  return useInvokeQuery<ListWorkspacesArgs, ListWorkspacesResult>('list_workspaces', {}, options)
}

export type OpenWorkspaceArgs = {}
export type OpenWorkspaceResult = string | null
export function useOpenWorkspaceMutation(
  options: UseMutationOptions<OpenWorkspaceResult, Error, OpenWorkspaceArgs>,
) {
  return useMutation<OpenWorkspaceResult, Error, OpenWorkspaceArgs>({
    mutationFn: async (_args) => {
      // Open a selection dialog for image files
      const selected = await open({
        directory: true,
        canCreateDirectories: true,
      })
      return selected
    },
    ...options,
  })
}

export type AddWorkspaceArgs = { workspace: Workspace }
export function useAddWorkspaceMutation(
  options: UseMutationOptions<void, Error, AddWorkspaceArgs>,
) {
  return useInvokeMutation<AddWorkspaceArgs, void>('add_workspace', options)
}

export type RemoveWorkspaceArgs = { workspacePath: string }
export function useRemoveWorkspaceMutation(
  options: UseMutationOptions<void, Error, RemoveWorkspaceArgs>,
) {
  return useInvokeMutation<RemoveWorkspaceArgs, void>('remove_workspace', options)
}

export type ListProductsArgs = {
  workspacePath: string
}
export type ListProductsResult = Array<ProductIndex>
export function useListProductsQuery(
  args: ListProductsArgs,
  options?: ExtendedQueryOptions<ListProductsResult>,
) {
  return useInvokeQuery<ListProductsArgs, Array<ProductIndex>>('list_products', args, options)
}

export type GetProductMetaArgs = {
  productPath: string
}
export type GetProductMetaResult = ProductMeta
export function useGetProductMetaQuery(
  args: GetProductMetaArgs,
  options?: ExtendedQueryOptions<GetProductMetaResult>,
) {
  return useInvokeQuery<GetProductMetaArgs, GetProductMetaResult>('get_product_meta', args, options)
}

export type GetProductFileArgs = {
  productPath: string
  fileName: string
}
export type GetProductFileResult = string
export function useGetProductFileQuery(
  args: GetProductFileArgs,
  options?: ExtendedQueryOptions<GetProductFileResult>,
) {
  return useInvokeQuery<GetProductFileArgs, GetProductFileResult>('get_product_file', args, options)
}

const invokeFetcher = async <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  args?: TArgs,
): Promise<TResult> => {
  // console.log(`${command} with args ${JSON.stringify(args)}`)
  try {
    const result: TResult = await invoke(command, args)
    // console.log(`${command} -> `, result)
    return result
  } catch (error) {
    console.error(`invoke command ${command}`, error)
    throw error
  }
}

export const useInvokeQuery = <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  args?: TArgs,
  extendendOptions: ExtendedQueryOptions<TResult> = {},
) => {
  return useQuery({
    queryKey: [command, args],
    queryFn: () => invokeFetcher<TArgs, TResult>(command, args),
    ...extendendOptions,
  })
}

export const useInvokeMutation = <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  useMutationOptions: UseMutationOptions<TResult, Error, TArgs> = {},
) => {
  return useMutation<TResult, Error, TArgs>({
    mutationFn: (args) => {
      return invokeFetcher<TArgs, TResult>(command, args)
    },
    ...useMutationOptions,
  })
}
