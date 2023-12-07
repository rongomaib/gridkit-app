'use client'

import { Heading as BaseHeading, HeadingProps as BaseHeadingProps } from '@chakra-ui/react'

export interface HeadingProps {
  as?: React.ComponentType | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  id?: BaseHeadingProps['id']
  size?: BaseHeadingProps['size']
  sx?: BaseHeadingProps['sx']
  children?: React.ReactNode | Array<React.ReactNode>
}

export function Heading(props: HeadingProps) {
  const { children, ...restProps } = props

  return <BaseHeading {...restProps}>{children}</BaseHeading>
}

export const headingTheme = {
  baseStyle: {
    fontWeight: 'normal',
  },
}
