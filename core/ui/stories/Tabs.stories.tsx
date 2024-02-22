import type { Meta, StoryObj } from '@storybook/react'

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../src/components/Tabs.js'

export default {
  component: Tabs,
  title: 'ui/Tabs',
} satisfies Meta<typeof Tabs>

type Story = StoryObj<typeof Tabs>

export const Example: Story = {
  render() {
    return (
      <Tabs size="lg">
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
          <Tab>Tab 3</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>First tab panel</TabPanel>
          <TabPanel>Second tab panel</TabPanel>
          <TabPanel>Third tab panel</TabPanel>
        </TabPanels>
      </Tabs>
    )
  },
}
