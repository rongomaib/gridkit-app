import {
  useAddWorkspaceMutation,
  useListWorkspacesQuery,
  useOpenWorkspaceMutation,
  useRemoveWorkspaceMutation,
} from '@/client'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

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
  const queryClient = useQueryClient()

  const listWorkspacesQuery = useListWorkspacesQuery()
  const workspaces = listWorkspacesQuery.isSuccess ? listWorkspacesQuery.data : null

  const openWorkspaceMutation = useOpenWorkspaceMutation({
    onSuccess(selectedDirectory) {
      if (typeof selectedDirectory !== 'string') return
      addWorkspace(selectedDirectory)
      selectWorkspace(selectedDirectory)
    },
  })
  const openWorkspace = useCallback(() => {
    openWorkspaceMutation.mutate({})
  }, [openWorkspaceMutation])

  const [activeWorkspacePath, selectWorkspace] = useState<string | null>(null)
  const activeWorkspace = useMemo(() => {
    if (workspaces == null) return null
    if (activeWorkspacePath == null) return null
    return workspaces.find((workspace) => workspace.path === activeWorkspacePath) || null
  }, [activeWorkspacePath, workspaces])

  const addWorkspaceMutation = useAddWorkspaceMutation({
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['list_workspaces'] })
    },
  })
  const addWorkspace = useCallback(
    (workspacePath: string) => {
      addWorkspaceMutation.mutate({ workspace: { path: workspacePath } })
    },
    [addWorkspaceMutation],
  )

  const removeWorkspaceMutation = useRemoveWorkspaceMutation({
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['list_workspaces'] })
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

const WorkspacesContext = createContext<WorkspacesState | null>(null)

export function WorkspacesProvider(props: React.PropsWithChildren<{}>) {
  const { children } = props
  const value = useWorkspaces()
  return <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>
}

export function useWorkspacesContext(): WorkspacesState {
  const context = useContext(WorkspacesContext)
  if (context == null) {
    throw new Error('useWorkspacesContext() must be wrapped with WorkspacesProvider')
  }
  return context
}
