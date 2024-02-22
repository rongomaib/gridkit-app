import type { Meta, StoryObj } from '@storybook/react'

import { Select } from '../src/components/Select.js'

export default {
  component: Select,
  title: 'ui/Select',
} satisfies Meta<typeof Select>

type Story = StoryObj<typeof Select>

export const Example: Story = {
  render() {
    return (
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
        <option value="c">Option C</option>
      </Select>
    )
  },
}
