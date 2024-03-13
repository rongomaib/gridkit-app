import '@fontsource/bitter'
import '@fontsource/fredoka-one'

import type { Preview } from '@storybook/react'
import { ChakraProvider, theme } from '@villagekit/ui'
import React from 'react'
import { QueryParamProvider } from 'use-query-params'
import { WindowHistoryAdapter } from 'use-query-params/adapters/window'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: 'white' },
        { name: 'primary', value: theme.colors.primary[50] },
        { name: 'accentA', value: theme.colors.accentA[50] },
        { name: 'accentB', value: theme.colors.accentB[50] },
      ],
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ChakraProvider theme={theme}>
        <Story />
      </ChakraProvider>
    ),
    (Story) => (
      <QueryParamProvider adapter={WindowHistoryAdapter}>
        <Story />
      </QueryParamProvider>
    ),
  ],
}

export default preview
