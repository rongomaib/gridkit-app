import { Field, Switch } from '@villagekit/ui'
import { useCallback } from 'react'
import * as SerializeQueryParams from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { type BaseProps, baseParamSchema } from './base'

const { BooleanParam: BooleanQueryParam } = SerializeQueryParams

export const BooleanId = 'boolean'
export type BooleanValue = boolean
export const booleanValueSchema = z.boolean()
export { BooleanQueryParam }

export const booleanParamSchema = baseParamSchema.extend({
  type: z.literal(BooleanId),
})
export type BooleanParam = z.infer<typeof booleanParamSchema>

export type BooleanProps = Omit<BooleanParam, 'type'> & BaseProps<BooleanValue>

// biome-ignore lint/suspicious/noShadowRestrictedNames:
export function Boolean(props: BooleanProps) {
  const { id, onChange, value, label, description } = props

  const handleChange = useCallback(
    (details: { checked: boolean }) => {
      onChange(details.checked)
    },
    [onChange],
  )

  return (
    <Field.Root id={id}>
      <Label label={label} description={description} htmlFor={id} />

      <Switch.Root id={id} aria-label={label} checked={value} onCheckedChange={handleChange}>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Field.Root>
  )
}
