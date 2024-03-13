'use client'

import { Button as BaseButton, type ButtonProps as BaseButtonProps } from '@chakra-ui/react'
import type { Dict } from '@chakra-ui/utils'
import { forwardRef } from 'react'
import { transparentize } from '../utility'

export interface ButtonProps
  extends Pick<
    BaseButtonProps,
    | 'type'
    | 'onClick'
    | 'isDisabled'
    | 'leftIcon'
    | 'rightIcon'
    | 'as'
    | 'sx'
    | 'children'
    | 'isLoading'
  > {
  size?: 'lg' | 'md' | 'sm' | 'xs'
  variant?: 'primary' | 'secondary' | 'tertiary' | 'toolbar'
  ref?: any
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <BaseButton ref={ref} {...props} />
})

export const buttonTheme = {
  baseStyle: {
    borderStyle: 'dashed',
    borderColor: 'transparent',
    borderRadius: 'xl',
    borderWidth: 1,
    fontFamily: 'heading',
    fontWeight: 'normal',
    transitionDuration: 'fast',
    WebkitTapHighlightColor: 'transparent',

    '&:not(:disabled)': {
      _hover: {
        transform: 'scale(1.08)',
      },

      _active: {
        transform: 'scale(1)',
      },

      _focus: {
        boxShadow: (theme: Dict) => theme.shadows.outline,
      },
    },
  },
  variants: {
    primary: {
      color: 'white',
      backgroundColor: 'primary.400',

      '&:not(:disabled)': {
        _hover: {
          backgroundColor: 'primary.500',
          color: 'white',
        },

        _active: {
          backgroundColor: 'primary.500',
        },
      },

      _hover: {
        _disabled: {
          backgroundColor: 'primary.400',
        },
      },

      _focus: {
        color: 'white',
      },
    },
    secondary: {
      color: 'primary.400',
      backgroundColor: 'white',
      borderColor: 'primary.400',

      '&:not(:disabled)': {
        _hover: {
          backgroundColor: 'primary.50',
          borderColor: 'primary.500',
          borderStyle: 'solid',
          color: 'primary.500',
        },

        _active: {
          borderColor: 'primary.500',
          color: 'primary.500',
        },
      },

      _focus: {
        color: 'primary.400',
      },
    },
    tertiary: {
      color: 'primary.400',

      '&:not(:disabled)': {
        _hover: {
          backgroundColor: (theme: Dict) => transparentize(theme.colors.primary[400], 0.1),
          color: 'primary.500',
        },

        _active: {
          color: 'primary.500',
        },
      },

      _focus: {
        color: 'primary.500',
      },
    },
    toolbar: {
      color: 'gray.700',

      '&:not(:disabled)': {
        _hover: {
          backgroundColor: (theme: Dict) => transparentize(theme.colors.primary[400], 0.1),
          color: 'primary.500',
        },

        _active: {
          color: 'primary.500',
        },
      },

      _focus: {
        color: 'gray.700',
      },
    },
  },
  defaultProps: {
    variant: 'primary',
  },
}
