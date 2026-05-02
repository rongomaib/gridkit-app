import '@fontsource/bitter'
import '@fontsource/fredoka-one'

import type { Preview } from '@storybook/react'
import { Provider } from '@villagekit/ui'
import React from 'react'
import { QueryParamProvider } from 'use-query-params'
import { WindowHistoryAdapter } from 'use-query-params/adapters/window'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: 'white' },
        { name: 'primary', value: 'var(--chakra-colors-primary-50)' },
        { name: 'accentA', value: 'var(--chakra-colors-accentA-50)' },
        { name: 'accentB', value: 'var(--chakra-colors-accentB-50)' },
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
      <Provider>
        <Story />
      </Provider>
    ),
    (Story) => (
      <QueryParamProvider adapter={WindowHistoryAdapter}>
        <Story />
      </QueryParamProvider>
    ),
  ],
}

export default preview
