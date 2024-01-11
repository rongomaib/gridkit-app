import { FormControl, Select as SelectComponent } from '@villagekit/ui'
import { map } from 'lodash-es'
import { ChangeEvent, useCallback } from 'react'
import { StringParam } from 'serialize-query-params'

import { Label } from '../components/label'
import { BaseOptions, BaseProps } from './base'

export const ChoiceId = 'choice'
export type ChoiceValue = string
export const ChoiceQueryParam = StringParam

export interface ChoiceOptions extends BaseOptions {
  type: typeof ChoiceId
  options: Record<ChoiceValue, string>
}

export type ChoiceProps = Omit<ChoiceOptions, 'type'> & BaseProps<ChoiceValue>

export function Choice(props: ChoiceProps) {
  const { id, onChange, value, label, helperText, options } = props

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      onChange(ev.target.value)
    },
    [onChange],
  )

  return (
    <FormControl id={id}>
      <Label label={label} helperText={helperText} />

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
