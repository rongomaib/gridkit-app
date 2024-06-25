'use client'

import { FaInfoCircle } from 'react-icons/fa'
import { Box, Icon, Tooltip, useMobileFriendlyTooltip } from '../index'
import type { TooltipProps } from './Tooltip'

export interface InfoTooltipProps extends Partial<TooltipProps> {
  label: React.ReactNode
  pointerTimeout?: number
}

export function InfoTooltip(props: InfoTooltipProps) {
  const { pointerTimeout, ...rest } = props

  const { onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip } =
    useMobileFriendlyTooltip(pointerTimeout)

  return (
    <Tooltip isOpen={showTooltip} {...rest}>
      <Box onPointerEnter={onPointerEnterTooltip} onPointerLeave={onPointerLeaveTooltip}>
        <Icon
          aria-label="Tooltip"
          as={FaInfoCircle}
          sx={{
            _hover: { color: 'primary.300' },

            color: 'gray.300',
            marginBottom: 1,
            transitionDuration: 'slow',
          }}
        />
      </Box>
    </Tooltip>
  )
}
