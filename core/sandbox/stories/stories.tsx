import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'

import type { Meta, StoryObj } from '@storybook/react'
import { Design, DesignPart, DesignWrapper } from '@villagekit/design'
import React from 'react'

import { Sandbox, SandboxProps } from '../src'

const decorator = (Story: React.FC) => (
  <React.Suspense fallback={null}>
    <Story />
  </React.Suspense>
)

const meta: Meta<SandboxProps> = {
  component: Sandbox,
  decorators: [decorator],
  title: 'Sandbox',
}

export default meta

type Story = StoryObj<typeof Sandbox>

interface StoryExample {
  id: string
  parts: Array<DesignPart>
}

function createStory(example: StoryExample) {
  const { id, parts } = example
  const design: Design = {
    meta: { id, name: id, description: '' },
    assembly: {
      type: 'static',
      parts,
    },
  }
  return function ExampleStory() {
    return (
      <DesignWrapper design={design}>
        <Sandbox />
      </DesignWrapper>
    )
  }
}

const emptyExample: StoryExample = { id: 'empty', parts: [] }
export const empty: Story = {
  render: createStory(emptyExample),
}

const oneBeamUpExample: StoryExample = {
  id: 'one-beam-up',
  parts: [
    {
      type: 'gridbeam:z',
      id: 'a',
      x: 0,
      y: 0,
      z: [0, 16],
    },
  ],
}
export const oneBeamUp: Story = {
  render: createStory(oneBeamUpExample),
}

const threeBeamsExample: StoryExample = {
  id: 'three-beams',
  parts: [
    {
      id: 'a',
      type: 'gridbeam:x',
      x: [0, 8],
      y: 1,
      z: 1,
    },
    {
      id: 'b',
      type: 'gridbeam:y',
      x: 1,
      y: [0, 12],
      z: 2,
    },
    {
      id: 'c',
      type: 'gridbeam:z',
      x: 0,
      y: 0,
      z: [0, 16],
    },
  ],
}
export const threeBeams: Story = {
  render: createStory(threeBeamsExample),
}

const onePanelXYDownExample: StoryExample = {
  id: 'one-panel-xy-down',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:xy',
      x: [0, 16],
      y: [0, 8],
      z: 0,
      fit: 'bottom',
    },
  ],
}
export const onePanelXYDown: Story = {
  render: createStory(onePanelXYDownExample),
}

const onePanelXYUpExample: StoryExample = {
  id: 'one-panel-xy-up',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:xy',
      x: [0, 16],
      y: [0, 8],
      z: 0,
      fit: 'top',
    },
  ],
}
export const onePanelXYUp: Story = {
  render: createStory(onePanelXYUpExample),
}

const onePanelXYUnholyExample: StoryExample = {
  id: 'one-panel-xy-unholy',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:xy',
      x: [0, 16],
      y: [0, 8],
      z: 0,
      holes: false,
    },
  ],
}
export const onePanelXYUnholy: Story = {
  render: createStory(onePanelXYUnholyExample),
}

const onePanelXYSpecificHolesExample: StoryExample = {
  id: 'one-panel-xy-specific-holes',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:xy',
      x: [0, 16],
      y: [0, 8],
      z: 0,
      holes: [
        [1, 1],
        [14, 1],
        [14, 6],
        [1, 6],
      ],
    },
  ],
}
export const onePanelXYSpecificHoles: Story = {
  render: createStory(onePanelXYSpecificHolesExample),
}

const onePanelYZUpExample: StoryExample = {
  id: 'one-panel-yz-up',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:yz',
      x: 0,
      y: [0, 16],
      z: [0, 8],
    },
  ],
}
export const onePanelYZUp: Story = { render: createStory(onePanelYZUpExample) }

const onePanelXZUpExample: StoryExample = {
  id: 'one-panel-xz-up',
  parts: [
    {
      id: 'a',
      type: 'gridpanel:xz',
      x: [0, 16],
      y: 0,
      z: [0, 8],
    },
  ],
}
export const onePanelXZUp: Story = { render: createStory(onePanelXZUpExample) }
