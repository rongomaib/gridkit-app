import { FormControl, FormLabel, Select } from '@villagekit/ui'
import { ChangeEvent, memo, useCallback } from 'react'
import { z } from 'zod'

import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  extractValuesSchemaFromParametersOptions,
} from '../'

export interface Preset<ParamsOptions extends ParametersOptions> {
  id: string
  label: string
  values: ExtractValuesFromParametersOptions<ParamsOptions>
}

export function getPresetValuesSchema<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
) {
  return extractValuesSchemaFromParametersOptions(parameters)
}

export function getPresetSchema<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
) {
  return z.object({
    id: z.string(),
    label: z.string(),
    values: getPresetValuesSchema(parameters),
  })
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

export function getPresetsSchema<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
) {
  const presetSchema = getPresetSchema(parameters)
  return z.array(presetSchema).min(1)
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
            {preset.label}
          </option>
        ))}

        <option value="custom">Custom</option>
      </Select>
    </FormControl>
  )
})
