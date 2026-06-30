import { Box, type SystemStyleObject } from '@villagekit/ui'
import type React from 'react'
import { useMemo } from 'react'
import { useControlsContext } from './context'

interface ControlProps {
  children: React.ReactNode | Array<React.ReactNode>
  bottom?: boolean
  left?: boolean
  right?: boolean
  top?: boolean
  css?: SystemStyleObject
  alwaysVisible?: boolean
}

const CONTROL_STYLES = {
  background: 'white',
  borderRadius: '3xl',
  boxShadow: 'md',
  opacity: 1,
  padding: 2,
  position: 'absolute',
  transitionDuration: 'fast',
  zIndex: 10,
}

export function Control(props: ControlProps) {
  const { children, bottom, left, right, top, css, alwaysVisible } = props

  const { controlMargin, controlScale } = useControlsContext()

  const positionStyles = useMemo(
    () => ({
      bottom: bottom ? controlMargin : undefined,
      left: left ? controlMargin : right ? undefined : '50%',
      right: right ? controlMargin : undefined,
      top: top ? controlMargin : bottom ? undefined : '50%',
      transform: `scale(${controlScale}) ${!left && !right ? 'translateX(-50%)' : ''} ${
        !bottom && !top ? 'translateY(-50%)' : ''
      }`,
      transformOrigin: `${right ? '100%' : 0} ${bottom ? '100%' : 0}`,
    }),
    [bottom, left, right, top, controlMargin, controlScale],
  )

  return (
    <Box
      css={{
        ...CONTROL_STYLES,
        ...positionStyles,
        ...css,
      }}
      className={alwaysVisible ? undefined : 'sandbox-controls'}
    >
      {children}
    </Box>
  )
}
