import type { Meta, StoryObj } from '@storybook/react'
import { FaIceCream } from 'react-icons/fa/index.js'

import { LinkCard } from '../src/components/LinkCard.js'

export default {
  component: LinkCard,
  title: 'ui/LinkCard',
} satisfies Meta<typeof LinkCard>

type Story = StoryObj<typeof LinkCard>

const exampleHref = 'https://gridkit.nz/'

export const Base: Story = {
  args: {
    description: 'Description',
    href: exampleHref,
    icon: FaIceCream,
    isExternal: true,
    title: 'Title',
  },
}
