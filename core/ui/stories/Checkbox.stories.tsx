import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from '../src/components/Checkbox.js'

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: 'ui/Checkbox',
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Base: Story = {}
