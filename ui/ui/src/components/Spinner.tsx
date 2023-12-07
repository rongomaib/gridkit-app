'use client'

import { Spinner as BaseSpinner } from '@chakra-ui/react'

import { useTheme } from '../hooks/useTheme.js'

export interface SpinnerProps {
  colorScheme?: 'primary' | 'accentA'
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
}

export function Spinner(props: SpinnerProps) {
  const { colorScheme = 'accentA' } = props

  const { colors } = useTheme()

  return <BaseSpinner color={colors[colorScheme][400]} emptyColor="gray.200" {...props} />
}
