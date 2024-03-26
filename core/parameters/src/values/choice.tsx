import { FormControl, Select as SelectComponent } from '@villagekit/ui'
import { map } from 'lodash-es'
import { type ChangeEvent, useCallback } from 'react'
import * as SerializeQueryParams from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { type BaseProps, baseParamSchema } from './base'

const { StringParam: StringQueryParam } = SerializeQueryParams

export const ChoiceId = 'choice'
export type ChoiceValue = string
export const choiceValueSchema = z.string()
export const ChoiceQueryParam = StringQueryParam

export const choiceParamSchema = baseParamSchema.extend({
  type: z.literal(ChoiceId),
  options: z.record(z.string(), z.string()),
})
export type ChoiceParam = z.infer<typeof choiceParamSchema>

export type ChoiceProps = Omit<ChoiceParam, 'type'> & BaseProps<ChoiceValue>

export function Choice(props: ChoiceProps) {
  const { id, onChange, value, label, description, options } = props

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      onChange(ev.target.value)
    },
    [onChange],
  )

  return (
    <FormControl id={id}>
      <Label label={label} description={description} />

      <SelectComponent aria-label={label} value={value} onChange={handleChange}>
        {map(options, (label, value) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectComponent>
    </FormControl>
  )
}
