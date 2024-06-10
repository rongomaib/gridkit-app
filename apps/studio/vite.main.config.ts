// https://github.com/electron/forge/blob/main/packages/template/vite-typescript/tmpl/vite.main.config.ts
import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig, mergeConfig } from 'vite'
import viteRequire from 'vite-plugin-require'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
  quietUseClientDirective,
  workspaceAliases,
} from './vite.base.config'

// https://vitejs.dev/config
export default defineConfig(async (env) => {
  const forgeEnv = env as ConfigEnv<'build'>
  const { forgeConfigSelf } = forgeEnv
  const define = getBuildDefine(forgeEnv)
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => '[name].js',
        formats: ['es'],
      },
      rollupOptions: {
        external,
        onwarn: quietUseClientDirective,
      },
    },
    plugins: [pluginHotRestart('restart'), viteTsconfigPaths(), (viteRequire as any).default()],
    define,
    resolve: {
      mainFields: ['module', 'jsnext:main', 'jsnext'],
      alias: {
        ...(await workspaceAliases()),
      },
    },
  }

  return mergeConfig(getBuildConfig(forgeEnv), config)
})
