import { Field, FormLabel, Select } from '@villagekit/ui'
import { find } from 'lodash-es'
import { type ChangeEvent, useCallback } from 'react'
import { z } from 'zod'
import {
  type ExtractValuesFromParams,
  type Params,
  extractValuesSchemaFromParams,
  usePresetId,
  usePresets,
  useUpdateParamsValues,
  useUpdatePresetId,
} from '../index'

export interface Preset<Ps extends Params> {
  id: string
  label: string
  values: ExtractValuesFromParams<Ps>
}

export function getPresetValuesSchema<Ps extends Params>(parameters: Ps) {
  return extractValuesSchemaFromParams(parameters)
}

export function getPresetSchema<Ps extends Params>(parameters: Ps) {
  return z.object({
    id: z.string(),
    label: z.string(),
    values: getPresetValuesSchema(parameters),
  })
}

export type Presets<Ps extends Params> = [Preset<Ps>, ...Array<Preset<Ps>>]

export function Presets<Ps extends Params>(presets: Presets<Ps>): Presets<Ps> {
  return presets
}

export function getPresetsSchema<Ps extends Params>(parameters: Ps) {
  const presetSchema = getPresetSchema(parameters)
  return z.array(presetSchema).min(1)
}

export function PresetControls() {
  const presetId = usePresetId()
  const presets = usePresets()
  const updatePresetId = useUpdatePresetId()
  const updateParamsValues = useUpdateParamsValues()

  const handlePresetChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      const selectedPresetId = ev.target.value
      if (selectedPresetId === 'custom') {
        const preset = find(presets, ['id', presetId])
        if (preset == null) return
        updateParamsValues(preset.values)
      } else {
        updatePresetId(selectedPresetId)
      }
    },
    [updatePresetId, updateParamsValues, presets, presetId],
  )

  if (presets == null) return null

  return (
    <Field.Root id="preset">
      <FormLabel>Preset</FormLabel>

      <Select.Root>
        <Select.Field role="menuitem" value={presetId || 'custom'} onChange={handlePresetChange}>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}

          <option value="custom">Custom</option>
        </Select.Field>
        <Select.Indicator />
      </Select.Root>
    </Field.Root>
  )
}
