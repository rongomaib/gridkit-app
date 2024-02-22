import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ipcLink } from 'electron-trpc/renderer'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ChakraProvider, Flex } from '@villagekit/ui'

import { client } from '@/client'
import { theme } from '@/theme'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { EditorProvider } from '@/context/editor'

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
            useErrorBoundary: process.env.NODE_ENV === 'development',
          },
        },
      }),
  )
  const [trpcClient] = useState(() =>
    client.createClient({
      links: [ipcLink()],
    }),
  )

  return (
    <ChakraProvider theme={theme}>
      <client.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
          {children}
        </QueryClientProvider>
      </client.Provider>
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
        sx={{ flexDirection: 'row', justifyContent: 'center', minHeight: '100dvh', width: '100%' }}
      >
        {children}
      </Flex>
    </>
  )
}
