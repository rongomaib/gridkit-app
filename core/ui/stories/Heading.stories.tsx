import type { Meta, StoryObj } from '@storybook/react'

import { useTheme } from '../src/index.js'
import { Heading, HeadingProps } from '../src/components/Heading.js'

export default {
  component: Heading,
  argTypes: {
    size: {
      control: {
        options: ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'],
        type: 'select',
      },
    },
  },
  title: 'ui/Heading',
} satisfies Meta<typeof Heading>

type Story = StoryObj<typeof Heading>

export const Base: Story = {
  args: {
    children: 'Heading',
  },
}

export const Sizes: Story = {
  render() {
    const theme = useTheme()

    return (
      <>
        {Object.keys(theme.components.Heading.sizes).map((size) => (
          <Heading key={size} size={size as HeadingProps['size']}>
            Heading {size}
          </Heading>
        ))}
      </>
    )
  },
}
