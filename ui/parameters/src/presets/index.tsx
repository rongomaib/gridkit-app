import { FormControl, FormLabel, Select } from '@villagekit/ui'
import { ChangeEvent, memo, useCallback } from 'react'

import { ExtractValuesFromParametersOptions, ParametersOptions } from '../'

export interface Preset<ParamsOptions extends ParametersOptions> {
  id: string
  name: string
  values: ExtractValuesFromParametersOptions<ParamsOptions>
}

export type Presets<ParamsOptions extends ParametersOptions> = [
  Preset<ParamsOptions>,
  ...Array<Preset<ParamsOptions>>,
]

export function Presets<ParamsOptions extends ParametersOptions>(
  presets: Presets<ParamsOptions>,
): Presets<ParamsOptions> {
  return presets
}

export interface PresetControlsProps<ParamsOptions extends ParametersOptions> {
  currentPresetId: Preset<ParamsOptions>['id']
  presets: Presets<ParamsOptions>
  onPresetChange: (preset: Preset<ParamsOptions>['id']) => void
}

export const PresetControls = memo(function PresetControls<
  ParamsOptions extends ParametersOptions,
>(props: PresetControlsProps<ParamsOptions>) {
  const { currentPresetId, presets, onPresetChange } = props

  const handlePresetChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      onPresetChange(ev.target.value)
    },
    [onPresetChange],
  )

  return (
    <FormControl id="preset" role="group">
      <FormLabel>Preset</FormLabel>

      <Select role="menuitem" value={currentPresetId} onChange={handlePresetChange}>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}

        <option value="custom">Custom</option>
      </Select>
    </FormControl>
  )
})
