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
import { NumberParam } from 'serialize-query-params'

import { Label } from '../components/label'
import { useParameterControlsInternalContext } from '../internal-context'
import { BaseOptions, BaseProps } from './base'

export const NumberId = 'number'
export type NumberValue = number
export const NumberQueryParam = NumberParam

export interface NumberOptions extends BaseOptions {
  type: typeof NumberId
  min: NumberValue
  max: NumberValue
  step?: NumberValue
}

export type NumberProps = Omit<NumberOptions, 'type'> & BaseProps<NumberValue>

// biome-ignore lint/suspicious/noShadowRestrictedNames:
export function Number(props: NumberProps) {
  const { id, onChange, value, label, helperText, min, max, step = 1 } = props

  const { onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip } = useMobileFriendlyTooltip()

  const { containerRef } = useParameterControlsInternalContext()

  return (
    <FormControl id={id} role="group">
      <Label label={label} helperText={helperText} />

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
