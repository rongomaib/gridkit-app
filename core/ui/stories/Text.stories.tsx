import type { Meta, StoryObj } from '@storybook/react'

import { useTheme } from '../src/index.js'
import { Text, TextProps, textTheme } from '../src/components/Text.js'

export default {
  component: Text,
  argTypes: {
    fontSize: {
      control: {
        options: ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'],
        type: 'select',
      },
    },
  },
  title: 'ui/Text',
} satisfies Meta<typeof Text>

type Story = StoryObj<typeof Text>

export const Base: Story = {
  args: {
    children: 'Text goes here',
  },
}

export const Sizes: Story = {
  render() {
    const theme = useTheme()

    return (
      <>
        {Object.keys(theme.components.Heading.sizes).map((size) => (
          <Text key={size} fontSize={size as TextProps['fontSize']}>
            Text with size {size}
          </Text>
        ))}
      </>
    )
  },
}

export const Variants: Story = {
  render() {
    return (
      <>
        {Object.keys(textTheme.variants).map((variant) => (
          <Text key={variant} variant={variant as TextProps['variant']}>
            Text with variant {variant}
          </Text>
        ))}
      </>
    )
  },
}
