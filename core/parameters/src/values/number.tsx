import { Field, Slider, Text, Tooltip, useMobileFriendlyTooltip } from '@villagekit/ui'
import { useCallback } from 'react'
import * as SerializeQueryParams from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { type BaseProps, baseParamSchema } from './base'

const { NumberParam: NumberQueryParam } = SerializeQueryParams

export const NumberId = 'number'
export type NumberValue = number
export const numberValueSchema = z.number()
export { NumberQueryParam }

export const numberParamSchema = baseParamSchema.extend({
  type: z.literal(NumberId),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
})
export type NumberParam = z.infer<typeof numberParamSchema>

export type NumberProps = Omit<NumberParam, 'type'> & BaseProps<NumberValue>

// biome-ignore lint/suspicious/noShadowRestrictedNames:
export function Number(props: NumberProps) {
  const { id, onChange, value, label, description, min, max, step = 1 } = props

  const { onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip } = useMobileFriendlyTooltip()

  const handleValueChange = useCallback(
    (details: { value: number[] }) => {
      const next = details.value[0]
      if (typeof next === 'number') onChange(next)
    },
    [onChange],
  )

  return (
    <Field.Root id={id}>
      <Label label={label} description={description} />

      <Slider.Root
        aria-label={[label]}
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>

          <Tooltip label={`${value * 40}mm`} open={showTooltip}>
            <Slider.Thumb
              index={0}
              onPointerEnter={onPointerEnterTooltip}
              onPointerLeave={onPointerLeaveTooltip}
              boxSize="6"
            >
              <Slider.HiddenInput />
              <Text fontSize="xs" css={{ color: 'primary.400', fontWeight: 'bold' }}>
                {value}
              </Text>
            </Slider.Thumb>
          </Tooltip>
        </Slider.Control>
      </Slider.Root>
    </Field.Root>
  )
}
