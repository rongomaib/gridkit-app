import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../../../@(core|parts|products)/*/stories/**/*.mdx',
    '../../../@(core|parts|products)/*/stories/**/stories.@(js|jsx|mjs|ts|tsx)',
    '../../../@(core|parts|products)/*/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
}
export default config
