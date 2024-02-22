import type { Meta, StoryObj } from '@storybook/react'
import { VStack } from '@chakra-ui/react'

import { Link, LinkProps, linkTheme } from '../src/components/Link.js'

export default {
  component: Link,
  title: 'ui/Link',
} satisfies Meta<typeof Link>

type Story = StoryObj<typeof Link>

const exampleHref = 'https://gridkit.nz/'

export const Base: Story = {
  args: {
    children: 'Link goes here',
    href: exampleHref,
    isExternal: true,
  },
}

export const Variants: Story = {
  render() {
    return (
      <VStack alignItems="flex-start">
        {Object.keys(linkTheme.variants).map((variant) => (
          <Link
            key={variant}
            href={exampleHref}
            isExternal
            variant={variant as LinkProps['variant']}
          >
            Link with variant {variant}
          </Link>
        ))}
      </VStack>
    )
  },
}
