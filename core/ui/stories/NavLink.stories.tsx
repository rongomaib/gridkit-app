import type { StoryObj, Meta } from '@storybook/react'
import { HStack, VStack } from '@chakra-ui/react'
import { useState } from 'react'

import { NavLink, NavLinkProps, navLinkTheme } from '../src/components/NavLink.js'

export default {
  component: NavLink,
  title: 'ui/NavLink',
} satisfies Meta<typeof NavLink>

type Story = StoryObj<typeof NavLink>

const exampleHref = 'https://gridkit.nz/'

export const Base: Story = {
  args: {
    children: 'Item 1',
    href: exampleHref,
    isExternal: true,
  },
}

export const Multiple: Story = {
  render() {
    const [selectedItem, setSelectedItem] = useState('Item 1')

    const items = ['Item 1', 'Item 2', 'Item 3']

    return (
      <HStack spacing="4">
        {items.map((item) => (
          <NavLink
            key={item}
            isSelected={selectedItem === item}
            onClick={() => setSelectedItem(item)}
            href={exampleHref}
            isExternal
          >
            {item}
          </NavLink>
        ))}
      </HStack>
    )
  },
}

export const Sizes: Story = {
  render() {
    return (
      <VStack alignItems="flex-start">
        {Object.keys(navLinkTheme.sizes).map((size) => (
          <NavLink key={size} size={size as NavLinkProps['size']}>
            NavLink {size}
          </NavLink>
        ))}
      </VStack>
    )
  },
}

export const Variants: Story = {
  render() {
    return (
      <VStack alignItems="flex-start">
        {Object.keys(navLinkTheme.variants).map((variant) => (
          <NavLink key={variant} variant={variant as NavLinkProps['variant']}>
            NavLink with variant {variant}
          </NavLink>
        ))}
      </VStack>
    )
  },
}
