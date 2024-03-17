import { theme as baseTheme } from '@villagekit/ui'

export const theme = {
  ...baseTheme,
  global: {
    'html, body, #root': {
      width: '100%',
      minHeight: '100dvh',
    },
  },
  radii: {
    ...baseTheme.radii,
    xl: '1rem',
  },
}
