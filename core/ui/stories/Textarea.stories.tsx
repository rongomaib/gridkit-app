import type { Meta, StoryObj } from '@storybook/react'

import { Textarea } from '../src/components/Textarea.js'

export default {
  component: Textarea,
  title: 'ui/Textarea',
} satisfies Meta<typeof Textarea>

type Story = StoryObj<typeof Textarea>

export const Base: Story = {}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Placeholder text...',
  },
}
