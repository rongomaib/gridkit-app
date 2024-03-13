'use client'

import {
  NumberInput as BaseNumberInput,
  type NumberInputProps as BaseNumberInputProps,
  useTheme,
} from '@chakra-ui/react'
import { forwardRef } from 'react'

export {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react'

export interface NumberInputProps
  extends Pick<
    BaseNumberInputProps,
    | 'id'
    | 'value'
    | 'defaultValue'
    | 'onBlur'
    | 'onChange'
    | 'placeholder'
    | 'variant'
    | 'size'
    | 'min'
    | 'max'
    | 'isDisabled'
    | 'children'
    | 'sx'
  > {
  ref?: any
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(props, ref) {
    const { variant } = props

    const {
      colors: { outlineColor },
    } = useTheme()

    return (
      <BaseNumberInput
        ref={ref}
        background={variant === 'flushed' ? 'transparent' : 'white'}
        focusBorderColor={outlineColor}
        {...props}
      />
    )
  },
)
