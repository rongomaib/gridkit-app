import { FormControl, Switch as SwitchComponent } from '@villagekit/ui'
import { type ChangeEvent, useCallback } from 'react'
import { BooleanParam } from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { type BaseProps, baseOptionsSchema } from './base'

export const BooleanId = 'boolean'
export type BooleanValue = boolean
export const booleanValueSchema = z.boolean()
export const BooleanQueryParam = BooleanParam

export const booleanOptionsSchema = baseOptionsSchema.extend({
  type: z.literal(BooleanId),
})
export type BooleanOptions = z.infer<typeof booleanOptionsSchema>

export type BooleanProps = Omit<BooleanOptions, 'type'> & BaseProps<BooleanValue>

// biome-ignore lint/suspicious/noShadowRestrictedNames:
export function Boolean(props: BooleanProps) {
  const { id, onChange, value, label, description } = props

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      onChange(ev.target.checked)
    },
    [onChange],
  )

  return (
    <FormControl id={id}>
      <Label label={label} description={description} htmlFor={id} />

      <SwitchComponent id={id} aria-label={label} isChecked={value} onChange={handleChange} />
    </FormControl>
  )
}
