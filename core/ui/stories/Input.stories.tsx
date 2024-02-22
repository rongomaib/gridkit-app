import type { Meta, StoryObj } from '@storybook/react'

import { Input } from '../src/components/Input.js'

export default {
  component: Input,
  title: 'ui/Input',
} satisfies Meta<typeof Input>

type Story = StoryObj<typeof Input>

export const Base: Story = {}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Placeholder text...',
  },
}
