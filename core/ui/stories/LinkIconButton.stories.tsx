import { HStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { FaLink } from 'react-icons/fa/index.js'

import { buttonTheme } from '../src/components/Button.js'
import { LinkIconButton, type LinkIconButtonProps } from '../src/components/LinkIconButton.js'

export default {
  component: LinkIconButton,
  title: 'ui/LinkIconButton',
} satisfies Meta<typeof LinkIconButton>

type Story = StoryObj<typeof LinkIconButton>

const exampleHref = 'https://gridkit.nz/'

export const Base: Story = {
  args: {
    href: exampleHref,
    icon: <FaLink />,
    isExternal: true,
  },
}

export const Variants: Story = {
  render() {
    return (
      <HStack>
        {Object.keys(buttonTheme.variants).map((variant) => (
          <LinkIconButton
            key={variant}
            href={exampleHref}
            isExternal
            aria-label="Link"
            icon={<FaLink />}
            variant={variant as LinkIconButtonProps['variant']}
          />
        ))}
      </HStack>
    )
  },
}
