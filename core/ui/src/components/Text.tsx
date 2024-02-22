'use client'

import { Text as BaseText, TextProps as BaseTextProps } from '@chakra-ui/react'

import { BaseProps } from '../types.js'

export interface TextProps extends BaseProps {
  as?: BaseTextProps['as']
  fontSize?: BaseTextProps['fontSize']
  variant?: 'primary' | 'secondary' | 'tertiary'
  sx?: BaseTextProps['sx']
  children?: React.ReactNode | Array<React.ReactNode>
}

export function Text(props: TextProps) {
  // @ts-ignore
  return <BaseText {...props} />
}

export const textTheme = {
  variants: {
    primary: {
      color: 'gray.900',
    },
    secondary: {
      color: 'gray.700',
    },
    tertiary: {
      color: 'gray.600',
    },
  },
  defaultProps: {
    variant: 'primary',
  },
}
