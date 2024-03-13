import { HStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { FaSearch } from 'react-icons/fa/index.js'

import { buttonTheme } from '../src/components/Button.js'
import { IconButton, type IconButtonProps } from '../src/components/IconButton.js'
import { useTheme } from '../src/index.js'

export default {
  component: IconButton,
  title: 'ui/IconButton',
} satisfies Meta<typeof IconButton>

type Story = StoryObj<typeof IconButton>

export const Basic: Story = {
  args: {
    icon: <FaSearch />,
    title: 'Search',
  },
}

export const Sizes: Story = {
  render() {
    const theme = useTheme()

    return (
      <HStack>
        {Object.keys(theme.components.Button.sizes).map((size) => (
          <IconButton
            key={size}
            title="Search"
            icon={<FaSearch />}
            size={size as IconButtonProps['size']}
          />
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
          <IconButton
            key={variant}
            title="Search"
            icon={<FaSearch />}
            variant={variant as IconButtonProps['variant']}
          />
        ))}
      </HStack>
    )
  },
}
