'use client'

import { Input as BaseInput, type InputProps as BaseInputProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useTheme } from '../hooks/useTheme'

export interface InputProps
  extends Pick<
    BaseInputProps,
    'id' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'placeholder' | 'sx'
  > {
  ref?: any
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    colors: { outlineColor },
  } = useTheme()

  return <BaseInput ref={ref} background="white" focusBorderColor={outlineColor} {...props} />
})
