import { useColorMode } from '@/context/colorMode'
import { useWorkspaceContext } from '@/context/workspace'
import { type Workspace, useWorkspacesContext } from '@/context/workspaces'
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  List,
  Tooltip,
  VStack,
} from '@villagekit/ui'
import { useMemo, useState } from 'react'
import { FaBars, FaChevronLeft, FaChevronRight, FaMoon, FaSun } from 'react-icons/fa'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  onPartMaker?: () => void
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const { children, onPartMaker } = props

  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductId } = useWorkspaceContext()
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const { isDark, toggle } = useColorMode()

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
          {onPartMaker && (
            <Box css={{ padding: 2, width: '100%' }}>
              <Button
                variant="toolbar"
                onClick={onPartMaker}
                css={{ width: '100%', fontSize: 'sm', justifyContent: 'flex-start' }}
              >
                + Part Maker
              </Button>
            </Box>
          )}
          <Box css={{ padding: 2, width: '100%' }}>
            <Button
              variant="toolbar"
              onClick={toggle}
              css={{ width: '100%', fontSize: 'sm', justifyContent: 'flex-start' }}
            >
              <Icon as={isDark ? FaSun : FaMoon} />
              {isDark ? 'Light mode' : 'Dark mode'}
            </Button>
          </Box>
        </VStack>
      ) : (
        <Box
          css={{ borderRight: '1px solid', borderColor: 'gray.200', padding: 2, height: '100%' }}
        >
          <IconButton
            aria-label="Expand sidebar"
            title="Expand sidebar"
            variant="secondary"
            onClick={() => setSidebarOpen(true)}
            icon={<Icon as={FaBars} />}
          />
          <Box css={{ marginTop: 2 }}>
            <IconButton
              aria-label="Toggle dark mode"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              variant="secondary"
              onClick={toggle}
              icon={<Icon as={isDark ? FaSun : FaMoon} />}
            />
          </Box>
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
