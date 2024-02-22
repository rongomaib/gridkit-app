'use client'

import { Box, BoxProps, SystemStyleObject } from '@chakra-ui/react'
import type { BaseProps } from '../types.js'

const focusStyle = {
  borderColor: 'outlineColor',
}

const hoverStyle = {
  backgroundColor: 'accentB.100',
  borderColor: 'accentB.300',
}

const containerHoverStyle = {
  cursor: 'pointer',
  transform: 'scale(1.05)',
}

export interface HoverCardProps extends BaseProps {
  as?: BoxProps['as']
  isHoverable?: boolean
  sx?: SystemStyleObject
  children: React.ReactNode | Array<React.ReactNode>
}

export function HoverCard(props: HoverCardProps) {
  const { as, isHoverable = true, sx, children, ...baseProps } = props

  return (
    <Box
      as={as}
      className="ui-hover-card"
      sx={{
        ...(isHoverable
          ? {
              _focusWithin: focusStyle,
              _hover: {
                ...containerHoverStyle,
                ...hoverStyle,
              },
            }
          : {}),

        backgroundColor: 'gray.50',
        borderColor: 'gray.200',
        borderRadius: 'xl',
        borderStyle: 'dashed',
        borderWidth: 2,
        overflow: 'hidden',
        transitionDuration: 'fast',

        ...sx,
      }}
      {...baseProps}
    >
      {children}
    </Box>
  )
}

export interface HoverCardContainerProps extends BaseProps {
  as?: BoxProps['as']
  sx?: SystemStyleObject
  children: React.ReactNode | Array<React.ReactNode>
}

export function HoverCardContainer(props: HoverCardContainerProps) {
  const { as, children, ...baseProps } = props

  return (
    <Box
      as={as}
      sx={{
        _focusWithin: {
          '.ui-hover-card': focusStyle,
        },

        _hover: {
          '.ui-hover-card': hoverStyle,
          ...containerHoverStyle,
        },

        transitionDuration: 'fast',
      }}
      {...baseProps}
    >
      {children}
    </Box>
  )
}
