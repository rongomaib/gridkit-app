import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  ParameterControls,
  ParameterControlsContextProvider,
  ParameterValueControls,
  ParametersOptions,
  PresetControls,
  Presets,
} from '../src'

const meta: Meta = {
  component: ParameterValueControls,
  title: 'Parameters',
}

export default meta

type Story = StoryObj

const simpleParameters = ParametersOptions({
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

const simplePresets = Presets<typeof simpleParameters>([
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

  return (
    <ParameterValueControls parameters={simpleParameters} values={values} onChange={setValues} />
  )
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

export function SimpleParameterControls() {
  return (
    <ParameterControlsContextProvider parameters={simpleParameters} presets={simplePresets}>
      <ParameterControls />
    </ParameterControlsContextProvider>
  )
}
