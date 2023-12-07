import type { Meta, StoryObj } from '@storybook/react'

import { HStack, Text } from '../src/index.js'
import { InfoTooltip, InfoTooltipProps } from '../src/components/InfoTooltip.js'

export default {
  component: InfoTooltip,
  title: 'ui/InfoTooltip',
} satisfies Meta<typeof InfoTooltip>

type Story = StoryObj<typeof InfoTooltip>

const render = (props: InfoTooltipProps) => (
  <HStack>
    <Text>Hover for more info</Text>
    <InfoTooltip {...props} />
  </HStack>
)

export const Base: Story = {
  args: {
    label: 'More info goes here!',
  },
  render,
}
