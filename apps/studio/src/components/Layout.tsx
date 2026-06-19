import { EditorProvider } from '@/context/editor'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { system } from '@/theme'
import { ChakraProvider, Flex } from '@villagekit/ui'

export interface LayoutProps {
  children: React.ReactNode
}
export function AppLayout({ children }: LayoutProps) {
  return (
    <ProvidersLayout>
      <ContextLayout>
        <ContentLayout>{children}</ContentLayout>
      </ContextLayout>
    </ProvidersLayout>
  )
}

export function ProvidersLayout({ children }: LayoutProps) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>
}

function ContextLayout({ children }: LayoutProps) {
  return (
    <WorkspacesProvider>
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </WorkspacesProvider>
  )
}

function WorkspaceLayout({ children }: LayoutProps) {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) return children

  return (
    <WorkspaceProvider workspace={activeWorkspace}>
      <ProductLayout>{children}</ProductLayout>
    </WorkspaceProvider>
  )
}

function ProductLayout({ children }: LayoutProps) {
  const { activeProductIndex } = useWorkspaceContext()
  const { activeWorkspace } = useWorkspacesContext()

  if (activeProductIndex == null || activeWorkspace == null) return children

  return (
    <EditorProvider>
      <ProductProvider productPath={activeProductIndex.path} workspacePath={activeWorkspace.path}>
        {children}
      </ProductProvider>
    </EditorProvider>
  )
}

function ContentLayout({ children }: LayoutProps) {
  return (
    <>
      <Flex
        css={{
          flexDirection: 'row',
          justifyContent: 'center',
          height: '100dvh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </Flex>
    </>
  )
}
