'use client'

import { Tooltip as BaseTooltip, TooltipProps as BaseTooltipProps } from '@chakra-ui/react'

export interface TooltipProps
  extends Pick<
    BaseTooltipProps,
    'label' | 'isOpen' | 'placement' | 'sx' | 'children' | 'portalProps'
  > {}

export function Tooltip(props: TooltipProps) {
  const { sx, ...rest } = props

  return (
    <BaseTooltip
      hasArrow
      arrowPadding={8}
      bg="primary.400"
      placement="top"
      sx={{
        borderRadius: 'md',
        fontSize: 'md',
        paddingX: 2,
        paddingY: 1,
        ...sx,
      }}
      {...rest}
    />
  )
}
