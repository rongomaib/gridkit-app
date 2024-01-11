import type { Meta, StoryObj } from '@storybook/react'

import { GridPanelSvg } from '../src/svg'

const meta: Meta = {
  component: GridPanelSvg,
  title: 'parts/GridPanel',
}

export default meta

type Story = StoryObj<typeof GridPanelSvg>

export const gridPanelSvg: Story = {
  args: {
    sizeInGrids: [60, 30],
  },
}
