'use client'

import { Link as BaseLink, LinkProps as BaseLinkProps } from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface LinkProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'paragraph'
  onClick?: BaseLinkProps['onClick']
  href?: BaseLinkProps['href']
  isExternal?: BaseLinkProps['isExternal']
  as?: BaseLinkProps['as']
  sx?: BaseLinkProps['sx']
  children?: React.ReactNode | Array<React.ReactNode>
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent focus state from applying to links on click
    e.preventDefault()
  }

  // @ts-ignore
  return <BaseLink ref={ref} onMouseDown={handleMouseDown} {...props} />
})

export const linkTheme = {
  baseStyle: {
    outline: 'none',
    borderRadius: 'md',

    _hover: {
      color: 'primary.700',
      textDecoration: 'none',
    },
  },
  variants: {
    primary: {
      color: 'accentA.600',
    },
    secondary: {
      color: 'gray.900',
    },
    tertiary: {
      color: 'gray.700',
    },
    paragraph: {
      color: 'accentA.800',
      textDecoration: 'underline',
      textUnderlineOffset: 2,

      _hover: {
        textDecoration: 'underline',
      },
    },
  },
  defaultProps: {
    variant: 'primary',
  },
}
