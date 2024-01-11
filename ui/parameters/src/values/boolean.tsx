import { FormControl, Switch as SwitchComponent } from '@villagekit/ui'
import { ChangeEvent, useCallback } from 'react'
import { BooleanParam } from 'serialize-query-params'

import { Label } from '../components/label'
import { BaseOptions, BaseProps } from './base'

export const BooleanId = 'boolean'
export type BooleanValue = boolean
export const BooleanQueryParam = BooleanParam

export interface BooleanOptions extends BaseOptions {
  type: typeof BooleanId
}

export type BooleanProps = Omit<BooleanOptions, 'type'> & BaseProps<BooleanValue>

// biome-ignore lint/suspicious/noShadowRestrictedNames:
export function Boolean(props: BooleanProps) {
  const { id, onChange, value, label, helperText } = props

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      onChange(ev.target.checked)
    },
    [onChange],
  )

  return (
    <FormControl id={id}>
      <Label label={label} helperText={helperText} htmlFor={id} />

      <SwitchComponent id={id} aria-label={label} isChecked={value} onChange={handleChange} />
    </FormControl>
  )
}
