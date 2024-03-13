import type { Meta, StoryObj } from '@storybook/react'

import { Tooltip } from '../src/components/Tooltip.js'
import { Button } from '../src/index.js'

export default {
  component: Tooltip,
  title: 'ui/Tooltip',
} satisfies Meta<typeof Tooltip>

type Story = StoryObj<typeof Tooltip>

export const Base: Story = {
  args: {
    label: 'Tooltip time!',
  },
  render(props) {
    return (
      <Tooltip {...props}>
        <Button>Hover me!</Button>
      </Tooltip>
    )
  },
}
