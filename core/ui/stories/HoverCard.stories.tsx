import { Box } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'

import { HoverCard } from '../src/components/HoverCard.js'

export default {
  component: HoverCard,
  title: 'ui/HoverCard',
} satisfies Meta<typeof HoverCard>

type Story = StoryObj<typeof HoverCard>

function ExampleContent() {
  return <Box sx={{ padding: 4 }}>Hey you, hover me!</Box>
}

export const Example: Story = {
  args: {
    children: <ExampleContent />,
  },
}
