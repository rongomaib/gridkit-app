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
        w="full"
        aria-label={[label]}
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        css={{ my: '2', px: '2' }}
      >
        <Slider.Control css={{ display: 'flex', alignItems: 'center', position: 'relative', h: '6' }}>
          <Slider.Track css={{ w: 'full', h: '1.5', bg: 'whiteAlpha.200', borderRadius: 'full', overflow: 'hidden' }}>
            <Slider.Range css={{ bg: 'primary.400', h: 'full' }} />
          </Slider.Track>

          <Tooltip label={`${value * 40}mm`} open={showTooltip}>
            <Slider.Thumb
              index={0}
              onPointerEnter={onPointerEnterTooltip}
              onPointerLeave={onPointerLeaveTooltip}
              boxSize="6"
              css={{
                bg: 'white',
                borderRadius: 'full',
                borderWidth: '1px',
                borderColor: 'whiteAlpha.300',
                boxShadow: 'sm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                _focus: { ring: '2px', ringColor: 'primary.400', ringOffset: '1px' }
              }}
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
