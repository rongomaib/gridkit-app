import type { Meta, StoryObj } from '@storybook/react'

import { Spinner } from '../src/components/Spinner.js'

export default {
  component: Spinner,
  title: 'ui/Spinner',
} satisfies Meta<typeof Spinner>

type Story = StoryObj<typeof Spinner>

export const Basic: Story = {}
