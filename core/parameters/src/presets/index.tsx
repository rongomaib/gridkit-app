import { FormControl, FormLabel, Select } from '@villagekit/ui'
import { ChangeEvent, useCallback } from 'react'
import { z } from 'zod'

import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  extractValuesSchemaFromParametersOptions,
  usePresetId,
  usePresets,
  useUpdateParametersValues,
  useUpdatePresetId,
} from '../'
import { find } from 'lodash-es'

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

export function PresetControls() {
  const presetId = usePresetId()
  const presets = usePresets()
  const updatePresetId = useUpdatePresetId()
  const updateParametersValues = useUpdateParametersValues()

  const handlePresetChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      const selectedPresetId = ev.target.value
      if (selectedPresetId === 'custom') {
        const preset = find(presets, ['id', presetId])
        if (preset == null) return
        updateParametersValues(preset.values)
      } else {
        updatePresetId(selectedPresetId)
      }
    },
    [updatePresetId, updateParametersValues, presets, presetId],
  )

  return (
    <FormControl id="preset" role="group">
      <FormLabel>Preset</FormLabel>

      <Select role="menuitem" value={presetId || 'custom'} onChange={handlePresetChange}>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}

        <option value="custom">Custom</option>
      </Select>
    </FormControl>
  )
}
