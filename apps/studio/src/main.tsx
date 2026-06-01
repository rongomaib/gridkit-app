import { AppLayout } from '@/components/Layout'
import Product from '@/components/Product'
import { WorkspaceLayout } from '@/components/WorkspaceLayout'
import WorkspaceSelector from '@/components/WorkspaceSelector'
import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'
import { createRoot } from 'react-dom/client'

const rootElement = document.getElementById('root')

if (rootElement == null) throw new Error('Failed to get root HTML element')

createRoot(rootElement).render(
  <AppLayout>
    <RootPage />
  </AppLayout>
)

function RootPage() {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) {
    return <WorkspaceSelector />
  }

  return <WorkspacePage />
}

function WorkspacePage() {
  const { activeProductIndex } = useWorkspaceContext()

  return (
    <WorkspaceLayout>
      {activeProductIndex != null ? <Product /> : null}
    </WorkspaceLayout>
  )
}
