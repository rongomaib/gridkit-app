import type { Meta, StoryObj } from '@storybook/react'

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from '../src/components/Accordion.js'

const meta: Meta<typeof Accordion> = {
  component: Accordion,
  title: 'ui/Accordion',
}

export default meta

type Story = StoryObj<typeof Accordion>

export const Example: Story = {
  render() {
    return (
      <Accordion allowMultiple>
        <AccordionItem>
          <AccordionButton>
            Item 1
            <AccordionIcon />
          </AccordionButton>

          <AccordionPanel>Content goes here</AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            Item 2
            <AccordionIcon />
          </AccordionButton>

          <AccordionPanel>More content goes here</AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
  },
}
