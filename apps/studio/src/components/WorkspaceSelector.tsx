import { useWorkspacesContext } from '@/context/workspaces'
import { Button, Heading, Icon, IconButton, List, VStack } from '@villagekit/ui'
import { FaTimes } from 'react-icons/fa'

interface WorkspaceSelectorProps {
  onPartMaker?: () => void
}

export default function WorkspaceSelector({ onPartMaker }: WorkspaceSelectorProps) {
  const { workspaces, openWorkspace, removeWorkspace, selectWorkspace } = useWorkspacesContext()

  return (
    <VStack css={{ maxWidth: { md: 'container.lg', base: 'full' } }}>
      <Heading as="h2">Workspaces</Heading>
      <VStack>
        <List.Root>
          {workspaces?.map((workspace) => (
            <List.Item key={workspace.path}>
              <Button variant="toolbar" onClick={() => selectWorkspace(workspace.path)}>
                {workspace.path}
              </Button>
              <IconButton
                aria-label="Close workspace"
                icon={<Icon as={FaTimes} />}
                variant="tertiary"
                onClick={() => removeWorkspace(workspace.path)}
              />
            </List.Item>
          ))}
        </List.Root>
      </VStack>
      <Button variant="secondary" onClick={openWorkspace}>
        Open new workspace
      </Button>
      {onPartMaker && (
        <Button variant="secondary" onClick={onPartMaker}>
          Open Part Maker
        </Button>
      )}
    </VStack>
  )
}
