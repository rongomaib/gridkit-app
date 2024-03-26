import { useBreakpointValue } from '../index'

export function useIsMobile(): boolean {
  return useBreakpointValue<boolean>(
    {
      base: true,
      md: false,
    },
    { fallback: 'md' },
  ) as boolean
}
