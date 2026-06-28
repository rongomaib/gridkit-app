import { AppLayout } from '@/components/Layout'
import { PartMaker } from '@/components/PartMaker'
import Product from '@/components/Product'
import { WorkspaceLayout } from '@/components/WorkspaceLayout'
import WorkspaceSelector from '@/components/WorkspaceSelector'
import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const rootElement = document.getElementById('root')

if (rootElement == null) throw new Error('Failed to get root HTML element')

createRoot(rootElement).render(
  <AppLayout>
    <RootPage />
  </AppLayout>,
)

type AppMode = 'products' | 'part-maker'

function RootPage() {
  const [mode, setMode] = useState<AppMode>('products')
  const { activeWorkspace } = useWorkspacesContext()

  if (mode === 'part-maker') {
    return <PartMaker onBack={() => setMode('products')} />
  }

  if (activeWorkspace == null) {
    return <WorkspaceSelector onPartMaker={() => setMode('part-maker')} />
  }

  return <WorkspacePage onPartMaker={() => setMode('part-maker')} />
}

function WorkspacePage({ onPartMaker }: { onPartMaker: () => void }) {
  const { activeProductIndex } = useWorkspaceContext()

  return (
    <WorkspaceLayout onPartMaker={onPartMaker}>
      {activeProductIndex != null ? <Product /> : null}
    </WorkspaceLayout>
  )
}
