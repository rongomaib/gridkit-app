'use client'

import { Textarea as BaseTextarea, type TextareaProps as BaseTextareaProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useTheme } from '../hooks/useTheme'

export interface TextareaProps
  extends Pick<
    BaseTextareaProps,
    'id' | 'value' | 'defaultValue' | 'onChange' | 'placeholder' | 'sx'
  > {
  ref?: any
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const {
      colors: { outlineColor },
    } = useTheme()

    return <BaseTextarea ref={ref} background="white" focusBorderColor={outlineColor} {...props} />
  },
)
