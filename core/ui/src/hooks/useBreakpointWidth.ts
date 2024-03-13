import { useBreakpointValue } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTheme } from './useTheme'

export const breakpointNames = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const
export type BreakpointName = (typeof breakpointNames)[number]

export function useBreakpointWidths(): Record<BreakpointName, number> {
  const { breakpoints } = useTheme()
  return useMemo(
    () => ({
      '2xl': emToPx(breakpoints['2xl']),
      base: emToPx(breakpoints.sm),
      lg: emToPx(breakpoints.lg),
      md: emToPx(breakpoints.md),
      sm: emToPx(breakpoints.sm),
      xl: emToPx(breakpoints.xl),
    }),
    [breakpoints],
  )
}

export function useBreakpointWidth(): number {
  const breakpointWidths = useBreakpointWidths()
  return useBreakpointValue<number>(breakpointWidths) as number
}

function emToPx(em: string): number {
  const emValue = Number(em.split('em')[0])
  return emValue * 16
}
