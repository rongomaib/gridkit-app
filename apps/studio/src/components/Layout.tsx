import { ColorModeProvider, useColorMode } from '@/context/colorMode'
import { EditorProvider } from '@/context/editor'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { system } from '@/theme'
import { ChakraProvider, Flex, Theme } from '@villagekit/ui'

export interface LayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: LayoutProps) {
  return (
    <ColorModeProvider>
      <ProvidersLayout>
        <ContextLayout>
          <ContentLayout>{children}</ContentLayout>
        </ContextLayout>
      </ProvidersLayout>
    </ColorModeProvider>
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
  const { isDark } = useColorMode()
  return (
    <Theme appearance={isDark ? 'dark' : 'light'}>
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
    </Theme>
  )
}
