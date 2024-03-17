import {
  FormControl,
  Slider as SliderComponent,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
  useMobileFriendlyTooltip,
} from '@villagekit/ui'
import { NumberParam as NumberQueryParam } from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { useParamControlsInternalContext } from '../internal-context'
import { type BaseProps, baseParamSchema } from './base'

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

  const { containerRef } = useParamControlsInternalContext()

  return (
    <FormControl id={id} role="group">
      <Label label={label} description={description} />

      <SliderComponent
        aria-label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        focusThumbOnChange={false}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>

        <Tooltip
          label={`${value * 40}mm`}
          isOpen={showTooltip}
          portalProps={{ containerRef: containerRef }}
        >
          <SliderThumb
            onPointerEnter={onPointerEnterTooltip}
            onPointerLeave={onPointerLeaveTooltip}
            boxSize="6"
          >
            <Text fontSize="xs" sx={{ color: 'primary.400', fontWeight: 'bold' }}>
              {value}
            </Text>
          </SliderThumb>
        </Tooltip>
      </SliderComponent>
    </FormControl>
  )
}
