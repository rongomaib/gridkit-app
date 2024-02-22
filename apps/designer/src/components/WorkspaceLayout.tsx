import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  List,
  ListIcon,
  ListItem,
  Tooltip,
  VStack,
} from '@villagekit/ui'
import { Resplit } from 'react-resplit'
import { useMemo } from 'react'
import { FaChevronRight } from 'react-icons/fa'

import { useWorkspaceContext } from '@/context/workspace'
import { Workspace, useWorkspacesContext } from '@/context/workspaces'

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
      <Flex sx={{ flexDirection: 'row', width: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.15fr" asChild>
          <VStack sx={{ paddingY: 4 }}>
            <Tooltip label={activeWorkspace.path}>
              <Box>
                <Heading as="h2" sx={{ fontSize: 'lg', fontWeight: 'bold' }}>
                  {activeWorkspaceName}
                </Heading>
              </Box>
            </Tooltip>
            <VStack>
              <List>
                {productIndexes?.map((productIndex) => (
                  <ListItem
                    key={productIndex.path}
                    sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                  >
                    <ListIcon as={FaChevronRight} />
                    <HStack>
                      <Button
                        variant="toolbar"
                        onClick={() => selectProductId(productIndex.id)}
                        sx={{ fontSize: 'md' }}
                      >
                        {productIndex.id}
                      </Button>
                      {/*
                <button type="button" onClick={() => removeproductName(productName.name)}>
                  X
                </button>
                */}
                    </HStack>
                  </ListItem>
                ))}
              </List>
              {/*
        <button type="button" onClick={handleCreateproductName}>
          Create new productName
        </button>
        */}
            </VStack>
          </VStack>
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.85fr" asChild>
          <VStack as="main" sx={{ flex: 1 }}>
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
