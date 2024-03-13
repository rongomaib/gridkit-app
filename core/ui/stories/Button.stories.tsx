import { HStack, Icon } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { capitalize } from 'lodash-es'
import { FaSearch } from 'react-icons/fa/index.js'

import { Button, type ButtonProps, buttonTheme } from '../src/components/Button.js'
import { useTheme } from '../src/index.js'

const meta: Meta<ButtonProps> = {
  component: Button,
  title: 'ui/Button',
}

export default meta

type Story = StoryObj<typeof Button>

export const Basic: Story = {
  args: {
    children: 'Button',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Button',
    leftIcon: <Icon as={FaSearch} />,
  },
}

export const Sizes: Story = {
  render() {
    const theme = useTheme()

    return (
      <HStack>
        {Object.keys(theme.components.Button.sizes).map((size) => (
          <Button key={size} size={size as ButtonProps['size']}>
            Button {size}
          </Button>
        ))}
      </HStack>
    )
  },
}

export const Variants: Story = {
  render() {
    return (
      <HStack>
        {Object.keys(buttonTheme.variants).map((variant) => (
          <Button key={variant} variant={variant as ButtonProps['variant']}>
            {capitalize(variant)}
          </Button>
        ))}
      </HStack>
    )
  },
}
