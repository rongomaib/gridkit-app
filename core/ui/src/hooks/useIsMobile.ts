import { useBreakpointValue } from '../'

export function useIsMobile(): boolean {
  return useBreakpointValue<boolean>(
    {
      base: true,
      md: false,
    },
    { fallback: 'md' },
  ) as boolean
}
