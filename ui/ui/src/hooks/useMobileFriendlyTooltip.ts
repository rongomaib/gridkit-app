import { useCallback, useMemo, useRef, useState } from 'react'

interface useMobileFriendlyTooltipProps {
  onPointerEnterTooltip: () => void
  onPointerLeaveTooltip: () => void
  showTooltip: boolean
}

export function useMobileFriendlyTooltip(pointerTimeout = 1000): useMobileFriendlyTooltipProps {
  const [showTooltip, setShowTooltip] = useState(false)

  const timeout = useRef<number>()

  const onPointerEnterTooltip = useCallback(() => {
    setShowTooltip(true)

    window.clearTimeout(timeout.current)
  }, [])

  const onPointerLeaveTooltip = useCallback(() => {
    timeout.current = window.setTimeout(() => setShowTooltip(false), pointerTimeout)
  }, [pointerTimeout])

  return useMemo(
    () => ({
      onPointerEnterTooltip,
      onPointerLeaveTooltip,
      showTooltip,
    }),
    [onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip],
  )
}
