import { client } from '@/client'
import constate from 'constate'
import { useEffect, useMemo, useState } from 'react'
import type { Workspace } from './workspaces'

export interface WorkspaceOptions {
  workspace: Workspace
}

export interface ProductIndex {
  path: string
  id: string
}

export interface WorkspaceState {
  productIndexes: Array<ProductIndex> | null
  activeProductIndex: ProductIndex | null
  selectProductId: (productId: string | null) => void
  // createProduct: (productId: string) => void
  // removeProduct: (productId: string) => void
}

function useWorkspace(options: WorkspaceOptions): WorkspaceState {
  const { workspace } = options

  const productIndexesQuery = client.listProducts.useQuery({ workspacePath: workspace.path })
  const productIndexes = productIndexesQuery.isSuccess ? productIndexesQuery.data : null

  const [activeProductId, selectProductId] = useState<string | null>(null)

  useEffect(() => {
    if (activeProductId == null && productIndexes?.[0] != null) {
      selectProductId(productIndexes[0].id)
    }
  }, [productIndexes, activeProductId])

  const activeProductIndex = useMemo(() => {
    if (productIndexes == null) return null
    if (activeProductId == null) return null
    return productIndexes.find((productIndex) => productIndex.id === activeProductId) || null
  }, [productIndexes, activeProductId])

  /*
  const addWorkspace = useCallback(
    (workspacePath: string) => {
      if (workspaces.find((workspace) => workspace.path === workspacePath)) {
        return
      }

      const newWorkspace = { path: workspacePath }
      const nextWorkspaces = [...workspaces, newWorkspace]
      setWorkspaces(nextWorkspaces)

      invoke('add_workspace', { workspace: newWorkspace })
    },
    [workspaces],
  )

  const removeWorkspace = useCallback(
    (workspacePath: string) => {
      const nextWorkspaces = workspaces.filter((workspace) => workspace.path !== workspacePath)
      setWorkspaces(nextWorkspaces)

      invoke('remove_workspace', { workspacePath })
    },
    [workspaces],
  )
  */

  return {
    productIndexes,
    activeProductIndex,
    selectProductId,
  }
}

export const [WorkspaceProvider, useWorkspaceContext] = constate(useWorkspace)
