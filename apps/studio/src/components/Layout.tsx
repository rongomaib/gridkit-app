import { EditorProvider } from '@/context/editor'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { system } from '@/theme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ChakraProvider, Flex } from '@villagekit/ui'
import { useState } from 'react'

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            throwOnError: process.env.NODE_ENV === 'development',
          },
        },
      }),
  )

  return (
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools buttonPosition="bottom-left" />
        {children}
      </QueryClientProvider>
    </ChakraProvider>
  )
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

  if (activeProductIndex == null) return children

  return (
    <EditorProvider>
      <ProductProvider productPath={activeProductIndex.path}>{children}</ProductProvider>
    </EditorProvider>
  )
}

function ContentLayout({ children }: LayoutProps) {
  return (
    <>
      <Flex
        css={{ flexDirection: 'row', justifyContent: 'center', minHeight: '100dvh', width: '100%' }}
      >
        {children}
      </Flex>
    </>
  )
}
