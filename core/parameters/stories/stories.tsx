import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  ParamControls,
  ParamControlsContextProvider,
  ParamValueControls,
  Params,
  PresetControls,
  Presets,
} from '../src'

const meta: Meta = {
  component: ParamValueControls,
  title: 'Params',
}

export default meta

type Story = StoryObj

const simpleParams = Params({
  select: {
    helperText: 'String as select',
    label: 'Select',
    options: {
      a: 'Option A',
      b: 'Option B',
      c: 'Option C',
    },
    type: 'choice',
  },
  slider: {
    helperText: 'Number as slider',
    label: 'Slider',
    max: 10,
    min: 0,
    step: 1,
    type: 'number',
  },
  switch: {
    helperText: 'Boolean as switch',
    label: 'Switch',
    type: 'boolean',
  },
})

const simplePresets = Presets<typeof simpleParams>([
  {
    id: 'default',
    name: 'Default',
    values: {
      select: 'a',
      slider: 1,
      switch: false,
    },
  },
  {
    id: 'another',
    name: 'Another',
    values: {
      select: 'b',
      slider: 9,
      switch: true,
    },
  },
])

export function SimpleValueControls() {
  const [values, setValues] = useState(simplePresets[0].values)

  return <ParamValueControls parameters={simpleParams} values={values} onChange={setValues} />
}

export function SimplePresetControls() {
  const [currentPresetId, setCurrentPresetId] = useState(simplePresets[0].id)

  return (
    <PresetControls
      currentPresetId={currentPresetId}
      presets={simplePresets}
      onPresetChange={setCurrentPresetId}
    />
  )
}

export function SimpleParamControls() {
  return (
    <ParamControlsContextProvider parameters={simpleParams} presets={simplePresets}>
      <ParamControls />
    </ParamControlsContextProvider>
  )
}
