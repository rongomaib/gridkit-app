import { useWorkspaceContext } from '@/context/workspace'
import { type Workspace, useWorkspacesContext } from '@/context/workspaces'
import { Box, Button, Flex, HStack, Heading, List, Tooltip, VStack, IconButton, Icon } from '@villagekit/ui'
import { useMemo, useState } from 'react'
import { FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}


export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const { children } = props

  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductId } = useWorkspaceContext()
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  const activeWorkspaceName = useMemo(() => getWorkspaceName(activeWorkspace), [activeWorkspace])

  return (
    <Flex css={{ flexDirection: 'row', width: '100%', height: '100%' }}>
      {isSidebarOpen ? (
        <VStack
          css={{
            width: '250px',
            alignItems: 'flex-start',
            height: '100%',
            overflowY: 'auto',
            margin: 0,
            paddingY: 2,
            borderRight: '1px solid',
            borderColor: 'gray.200',
            position: 'relative',
          }}
        >
          <IconButton
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            variant="secondary"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            icon={<Icon as={FaChevronLeft} />}
            css={{ position: 'absolute', right: '8px', top: '8px' }}
          />
          <Tooltip label={activeWorkspace.path}>
            <Box css={{ alignSelf: 'center', paddingRight: '24px' }}>
              <Heading as="h2" css={{ fontSize: 'lg', fontWeight: 'bold' }}>
                {activeWorkspaceName}
              </Heading>
            </Box>
          </Tooltip>
          <VStack css={{ width: '100%', alignItems: 'stretch' }}>
            <List.Root>
              {productIndexes?.map((productIndex) => (
                <List.Item
                  key={productIndex.path}
                  css={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <List.Indicator asChild css={{ marginInlineEnd: 0 }}>
                    <FaChevronRight />
                  </List.Indicator>
                  <HStack>
                    <Button
                      variant="toolbar"
                      onClick={() => selectProductId(productIndex.id)}
                      css={{
                        fontSize: 'md',
                        paddingInlineStart: 1,
                        paddingInlineEnd: 1,
                      }}
                    >
                      {productIndex.id}
                    </Button>
                  </HStack>
                </List.Item>
              ))}
            </List.Root>
          </VStack>
          <Box css={{ flexGrow: 1 }} />
        </VStack>
      ) : (
        <Box css={{ borderRight: '1px solid', borderColor: 'gray.200', padding: 2, height: '100%' }}>
          <IconButton
            aria-label="Expand sidebar"
            title="Expand sidebar"
            variant="secondary"
            onClick={() => setSidebarOpen(true)}
            icon={<Icon as={FaBars} />}
          />
        </Box>
      )}
      <VStack as="main" css={{ flex: 1, height: '100%', minWidth: 0 }}>
        {children}
      </VStack>
    </Flex>
  )
}

const workspaceNameRe = /^.*[\\\/](.+)/
function getWorkspaceName(workspace: Workspace) {
  const { path } = workspace
  return path.match(workspaceNameRe)?.[1] || path
}
