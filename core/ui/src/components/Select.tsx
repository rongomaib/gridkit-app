'use client'

import { Select as BaseSelect, SelectProps as BaseSelectProps } from '@chakra-ui/react'

import { useTheme } from '../hooks/useTheme.js'

export interface SelectProps
  extends Pick<
    BaseSelectProps,
    'id' | 'role' | 'value' | 'defaultValue' | 'onChange' | 'sx' | 'children'
  > {}

export function Select(props: SelectProps) {
  const {
    colors: { outlineColor },
  } = useTheme()

  return <BaseSelect background="white" focusBorderColor={outlineColor} {...props} />
}
