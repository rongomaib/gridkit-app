import type { Meta, StoryObj } from '@storybook/react'

import {
  Slider,
  SliderFilledTrack,
  type SliderProps,
  SliderThumb,
  SliderTrack,
} from '../src/components/Slider.js'

const meta: Meta<typeof Slider> = {
  component: Slider,
  title: 'ui/Slider',
}

export default meta

type Story = StoryObj<typeof Slider>

const render = (props: SliderProps) => (
  <Slider {...props}>
    <SliderTrack>
      <SliderFilledTrack />
    </SliderTrack>
    <SliderThumb />
  </Slider>
)

export const Base: Story = {
  args: {
    max: 10,
    min: 0,
    step: 1,
  },
  render,
}
