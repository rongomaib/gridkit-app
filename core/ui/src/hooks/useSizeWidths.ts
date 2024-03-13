import { useMemo } from 'react'
import { useTheme } from './useTheme'

export const sizeNames = [
  'full',
  '3xs',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  'container.md',
  'container.md',
  'container.lg',
  'container.xl',
] as const
export type SizeName = (typeof sizeNames)[number]

export function useSizeWidths(): Record<SizeName, number | '100%'> {
  const { sizes } = useTheme()

  return useMemo(
    () => ({
      full: sizes.full,
      '3xs': emToPx(sizes['3xs']),
      '2xs': emToPx(sizes['2xs']),
      xs: emToPx(sizes['xs']),
      sm: emToPx(sizes['sm']),
      md: emToPx(sizes['md']),
      lg: emToPx(sizes['lg']),
      xl: emToPx(sizes['xl']),
      '2xl': emToPx(sizes['2xl']),
      '3xl': emToPx(sizes['3xl']),
      '4xl': emToPx(sizes['4xl']),
      '5xl': emToPx(sizes['5xl']),
      '6xl': emToPx(sizes['6xl']),
      '7xl': emToPx(sizes['7xl']),
      '8xl': emToPx(sizes['8xl']),
      'container.sm': parsePx(sizes['container']['sm']),
      'container.md': parsePx(sizes['container']['md']),
      'container.lg': parsePx(sizes['container']['lg']),
      'container.xl': parsePx(sizes['container']['xl']),
    }),
    [sizes],
  )
}

function parsePx(px: string): number {
  return Number(px.split(/px/)[0])
}

function emToPx(em: string): number {
  const emValue = Number(em.split(/r?em/)[0])
  return emValue * 16
}
