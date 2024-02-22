import { useWorkspacesContext } from '@/context/workspaces'
import { Button, Heading, Icon, IconButton, List, ListItem, Text, VStack } from '@villagekit/ui'
import { FaTimes } from 'react-icons/fa'

export default function WorkspaceSelector() {
  const { workspaces, openWorkspace, removeWorkspace, selectWorkspace } = useWorkspacesContext()

  return (
    <VStack sx={{ maxWidth: { md: 'container.lg', base: 'full' } }}>
      <Heading as="h2">Workspaces</Heading>
      <VStack>
        <List>
          {workspaces?.map((workspace) => (
            <ListItem key={workspace.path}>
              <Button variant="toolbar" onClick={() => selectWorkspace(workspace.path)}>
                {workspace.path}
              </Button>
              <IconButton
                aria-label="Close workspace"
                icon={<Icon as={FaTimes} />}
                variant="tertiary"
                onClick={() => removeWorkspace(workspace.path)}
              />
            </ListItem>
          ))}
        </List>
      </VStack>
      <Button variant="secondary" onClick={openWorkspace}>
        Open new workspace
      </Button>
    </VStack>
  )
}
