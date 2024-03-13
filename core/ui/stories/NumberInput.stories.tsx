import type { Meta, StoryObj } from '@storybook/react'

import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  type NumberInputProps,
  NumberInputStepper,
} from '../src/components/NumberInput.js'

export default {
  component: NumberInput,
  title: 'ui/NumberInput',
} satisfies Meta<typeof NumberInput>

type Story = StoryObj<typeof NumberInput>

const renderBase = (props: NumberInputProps) => (
  <NumberInput {...props}>
    <NumberInputField />
  </NumberInput>
)

export const Base: Story = {
  render: renderBase,
}

export const Flushed: Story = {
  args: {
    variant: 'flushed',
  },
  render: renderBase,
}

const renderStepper = (props: NumberInputProps) => (
  <NumberInput {...props}>
    <NumberInputField />
    <NumberInputStepper>
      <NumberIncrementStepper />
      <NumberDecrementStepper />
    </NumberInputStepper>
  </NumberInput>
)

export const WithStepper: Story = {
  render: renderStepper,
}

export const WithRange: Story = {
  args: {
    max: 100,
    min: 0,
  },
  render: renderStepper,
}
