import type { Meta, StoryObj } from '@storybook/react'
import { HStack } from '@chakra-ui/react'
import { capitalize } from 'lodash-es'

import { buttonTheme } from '../src/components/Button.js'
import { LinkButton, LinkButtonProps } from '../src/components/LinkButton.js'

export default {
  component: LinkButton,
  title: 'ui/LinkButton',
} satisfies Meta<typeof LinkButton>

type Story = StoryObj<typeof LinkButton>

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
      <HStack>
        {Object.keys(buttonTheme.variants).map((variant) => (
          <LinkButton
            key={variant}
            href={exampleHref}
            isExternal
            variant={variant as LinkButtonProps['variant']}
          >
            {capitalize(variant)}
          </LinkButton>
        ))}
      </HStack>
    )
  },
}
