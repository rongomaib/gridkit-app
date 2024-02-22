import { useBreakpointValue } from '..//index.js'

export function useIsMobile(): boolean {
  return useBreakpointValue<boolean>(
    {
      base: true,
      md: false,
    },
    { fallback: 'md' },
  ) as boolean
}
