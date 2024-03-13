import { Box, HStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'

import { Text, useTheme } from '../src/index.js'

export default {
  title: 'ui/Theme/Transitions',
} satisfies Meta

type Story = StoryObj

interface TransitionExampleProps {
  duration: string
}

function TransitionExample(props: TransitionExampleProps) {
  const { duration } = props

  return (
    <Box
      sx={{
        flex: 1,
        padding: 1,
        height: '50',
        backgroundColor: 'accentB.200',
        borderRadius: 'xl',
        boxShadow: 'md',
        transitionDuration: duration,

        _hover: {
          cursor: 'pointer',
          height: '150',
        },
      }}
    >
      <Text fontSize="sm" sx={{ textAlign: 'center' }}>
        {duration}
      </Text>
    </Box>
  )
}

export const Transitions: Story = {
  render() {
    const { transition } = useTheme()

    return (
      <HStack alignItems="flex-start" sx={{ padding: 4 }}>
        {Object.keys(transition.duration).map((duration) => (
          <TransitionExample key={duration} duration={duration} />
        ))}
      </HStack>
    )
  },
}
