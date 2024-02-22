import type { Meta, StoryObj } from '@storybook/react'

import { Switch } from '../src/components/Switch.js'

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: 'ui/Switch',
}

export default meta

type Story = StoryObj<typeof Switch>

export const Base: Story = {}
