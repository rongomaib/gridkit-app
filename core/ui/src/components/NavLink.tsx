'use client'

import { useStyleConfig } from '@chakra-ui/react'
import { type KeyboardEvent, forwardRef } from 'react'

import { Link, type LinkProps } from '../'

export interface NavLinkProps
  extends Pick<LinkProps, 'as' | 'href' | 'isExternal' | 'onClick' | 'children'> {
  isSelected?: boolean
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  variant?: 'heading' | 'text'
  onKeyDown?: (ev: KeyboardEvent) => void
  tabIndex?: string
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(props, ref) {
  const { size, variant, isSelected, ...rest } = props

  const styles = useStyleConfig('NavLink', { size, variant })

  return (
    <Link
      ref={ref}
      variant="secondary"
      sx={{
        ...styles,

        position: 'relative',

        ...(isSelected
          ? {
              '&::after': {
                borderBottomWidth: 2,
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderColor: 'primary.500',
                borderStyle: 'dashed',
                bottom: 0,
                content: '""',
                display: 'block',
                position: 'absolute',
                width: '100%',
              },
            }
          : {}),
      }}
      {...rest}
    />
  )
})

export const navLinkTheme = {
  sizes: {
    xl: {
      fontSize: '3xl',
    },
    lg: {
      fontSize: '2xl',
    },
    md: {
      fontSize: 'xl',
    },
    sm: {
      fontSize: 'lg',
    },
    xs: {
      fontSize: 'md',
    },
  },
  variants: {
    text: {
      fontFamily: 'body',
    },
    heading: {
      fontFamily: 'heading',
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'heading',
  },
}
