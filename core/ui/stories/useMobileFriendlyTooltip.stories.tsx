import type { Meta, StoryObj } from '@storybook/react'
import { FaIceCream } from 'react-icons/fa'

import { useMobileFriendlyTooltip } from '../src/hooks/useMobileFriendlyTooltip.js'
import { Box, Icon, Tooltip } from '../src/index.js'

export default {
  title: 'ui/Helpers/UseMobileFriendlyTooltip',
} satisfies Meta

type Story = StoryObj

export const UseMobileFriendlyTooltip: Story = {
  render() {
    const { onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip } = useMobileFriendlyTooltip()

    return (
      <Tooltip label="Mobile friendly tooltip!" isOpen={showTooltip}>
        <Box
          onPointerEnter={onPointerEnterTooltip}
          onPointerLeave={onPointerLeaveTooltip}
          sx={{ width: 'max-content' }}
        >
          <Icon as={FaIceCream} sx={{ color: 'primary.300' }} />
        </Box>
      </Tooltip>
    )
  },
}
