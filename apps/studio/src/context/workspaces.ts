import { client } from '@/client'
import constate from 'constate'
import { useCallback, useMemo, useState } from 'react'

export interface Workspace {
  path: string
}

export interface WorkspacesState {
  workspaces: Array<Workspace> | null
  openWorkspace: () => void
  activeWorkspace: Workspace | null
  addWorkspace: (workspacePath: string) => void
  removeWorkspace: (workspacePath: string) => void
  selectWorkspace: (workspacePath: string | null) => void
}

function useWorkspaces(): WorkspacesState {
  const queryUtils = client.useUtils()

  const listWorkspacesQuery = client.listWorkspaces.useQuery()
  const workspaces = listWorkspacesQuery.isSuccess ? listWorkspacesQuery.data : null

  const openWorkspaceMutation = client.openWorkspace.useMutation({
    onSuccess(selectedDirectory) {
      if (typeof selectedDirectory !== 'string') return
      addWorkspace(selectedDirectory)
      selectWorkspace(selectedDirectory)
    },
  })
  const openWorkspace = useCallback(() => {
    openWorkspaceMutation.mutate()
  }, [openWorkspaceMutation])

  const [activeWorkspacePath, selectWorkspace] = useState<string | null>(null)
  const activeWorkspace = useMemo(() => {
    if (workspaces == null) return null
    if (activeWorkspacePath == null) return null
    return workspaces.find((workspace) => workspace.path === activeWorkspacePath) || null
  }, [activeWorkspacePath, workspaces])

  const addWorkspaceMutation = client.addWorkspace.useMutation({
    onSuccess() {
      queryUtils.listWorkspaces.invalidate()
    },
  })
  const addWorkspace = useCallback(
    (workspacePath: string) => {
      addWorkspaceMutation.mutate({ workspace: { path: workspacePath } })
    },
    [addWorkspaceMutation],
  )

  const removeWorkspaceMutation = client.removeWorkspace.useMutation({
    onSuccess() {
      queryUtils.listWorkspaces.invalidate()
    },
  })
  const removeWorkspace = useCallback(
    (workspacePath: string) => {
      removeWorkspaceMutation.mutate({ workspacePath })
    },
    [removeWorkspaceMutation],
  )

  return {
    workspaces,
    openWorkspace,
    activeWorkspace,
    selectWorkspace,
    addWorkspace,
    removeWorkspace,
  }
}

export const [WorkspacesProvider, useWorkspacesContext] = constate(useWorkspaces)
