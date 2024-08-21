// https://github.com/electron/forge/blob/main/packages/template/vite-typescript/tmpl/vite.renderer.config.ts

import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { pluginExposeRenderer, quietUseClientDirective, workspaceAliases } from './vite.base.config'

// https://vitejs.dev/config
export default defineConfig(async (env) => {
  const forgeEnv = env as ConfigEnv<'renderer'>
  const { root, mode, forgeConfigSelf } = forgeEnv
  const name = forgeConfigSelf.name ?? ''

  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
      rollupOptions: {
        onwarn: quietUseClientDirective,
      },
    },
    plugins: [tsconfigPaths(), pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
      alias: {
        ...(await workspaceAliases()),
      },
    },
    clearScreen: false,
    optimizeDeps: {
      exclude: ['@swc/wasm-web'],
    },
  } as UserConfig
})
