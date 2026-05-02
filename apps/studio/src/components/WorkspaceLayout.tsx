import { useWorkspaceContext } from '@/context/workspace'
import { type Workspace, useWorkspacesContext } from '@/context/workspaces'
import { Box, Button, Flex, HStack, Heading, List, Tooltip, VStack } from '@villagekit/ui'
import { useMemo } from 'react'
import { FaChevronRight } from 'react-icons/fa'
import { Resplit } from 'react-resplit'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const { children } = props

  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductId } = useWorkspaceContext()

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  const activeWorkspaceName = useMemo(() => getWorkspaceName(activeWorkspace), [activeWorkspace])

  return (
    <Resplit.Root direction="horizontal" asChild>
      <Flex css={{ flexDirection: 'row', width: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.15fr" asChild>
          <VStack
            css={{
              alignItems: 'flex-start',
              maxHeight: '100dvh',
              overflowY: 'auto',
              margin: 0,
              paddingY: 2,
            }}
          >
            <Tooltip label={activeWorkspace.path}>
              <Box css={{ alignSelf: 'center' }}>
                <Heading as="h2" css={{ fontSize: 'lg', fontWeight: 'bold' }}>
                  {activeWorkspaceName}
                </Heading>
              </Box>
            </Tooltip>
            <VStack>
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
              {/*
        <button type="button" onClick={handleCreateproductName}>
          Create new productName
        </button>
        */}
            </VStack>
          </VStack>
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box css={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.85fr" asChild>
          <VStack as="main" css={{ flex: 1 }}>
            {children}
          </VStack>
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

const workspaceNameRe = /^.*[\\\/](.+)/
function getWorkspaceName(workspace: Workspace) {
  const { path } = workspace
  return path.match(workspaceNameRe)?.[1] || path
}
