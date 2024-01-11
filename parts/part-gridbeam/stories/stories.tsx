import type { Meta, StoryObj } from '@storybook/react'

import { GridBeamSvg } from '../src/svg'

const meta: Meta = {
  component: GridBeamSvg,
  title: 'parts/GridBeam',
}

export default meta

type Story = StoryObj<typeof GridBeamSvg>

export const gridBeamSvg: Story = {
  args: {
    sizeInGrids: 60,
  },
}
