import { config, createSystem, defaultConfig, defineConfig } from '@villagekit/ui'

const studioConfig = defineConfig({
  globalCss: {
    'html, body, #root': {
      width: '100%',
      minHeight: '100dvh',
    },
  },
  theme: {
    tokens: {
      radii: {
        xl: { value: '1rem' },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config, studioConfig)
