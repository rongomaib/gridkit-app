import { readFile, readdir, realpath } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import type { BuildOptions, ConfigEnv, Plugin, UserConfig } from 'vite'

export const builtins = ['electron', ...builtinModules.flatMap((m) => [m, `node:${m}`])]

export const external = [...builtins]

export function getBuildConfig(env: ConfigEnv<'build'>): UserConfig {
  const { root, mode, command } = env

  return {
    root,
    mode,
    build: {
      // Prevent multiple builds from interfering with each other.
      emptyOutDir: false,
      // 🚧 Multiple builds may conflict.
      outDir: '.vite/build',
      watch: command === 'serve' ? {} : null,
      minify: command === 'build',
    },
    clearScreen: false,
  }
}

export function getDefineKeys(names: string[]) {
  const define: { [name: string]: VitePluginRuntimeKeys } = {}

  return names.reduce((acc, name) => {
    const NAME = name.toUpperCase()
    const keys: VitePluginRuntimeKeys = {
      VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
      VITE_NAME: `${NAME}_VITE_NAME`,
    }
    acc[name] = keys
    return acc
  }, define)
}

export function getBuildDefine(env: ConfigEnv<'build'>) {
  const { command, forgeConfig } = env
  const names = forgeConfig.renderer.filter(({ name }) => name != null).map(({ name }) => name!)
  const defineKeys = getDefineKeys(names)
  const define = Object.entries(defineKeys).reduce(
    (acc, [name, keys]) => {
      const { VITE_DEV_SERVER_URL, VITE_NAME } = keys
      const def = {
        [VITE_DEV_SERVER_URL]:
          command === 'serve' ? JSON.stringify(process.env[VITE_DEV_SERVER_URL]) : undefined,
        [VITE_NAME]: JSON.stringify(name),
      }
      return Object.assign(acc, def)
    },
    {} as Record<string, any>,
  )

  return define
}

export function pluginExposeRenderer(name: string): Plugin {
  const { VITE_DEV_SERVER_URL } = getDefineKeys([name])[name] as VitePluginRuntimeKeys

  return {
    name: '@electron-forge/plugin-vite:expose-renderer',
    configureServer(server) {
      process.viteDevServers ??= {}
      // Expose server for preload scripts hot reload.
      process.viteDevServers[name] = server

      server.httpServer?.once('listening', () => {
        const addressInfo = server.httpServer!.address() as AddressInfo
        // Expose env constant for main process use.
        process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`
      })
    },
  }
}

export function pluginHotRestart(command: 'reload' | 'restart'): Plugin {
  return {
    name: '@electron-forge/plugin-vite:hot-restart',
    closeBundle() {
      if (command === 'reload') {
        for (const server of Object.values(process.viteDevServers)) {
          // Preload scripts hot reload.
          server.ws.send({ type: 'full-reload' })
        }
      } else {
        // Main process hot restart.
        // https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
        process.stdin.emit('data', 'rs')
      }
    },
  }
}

// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
type RollupOnWarn = NonNullable<BuildOptions['rollupOptions']>['onwarn']
export const quietUseClientDirective: RollupOnWarn = (warning, warn) => {
  if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes(`"use client"`)) {
    return
  }
  warn(warning)
}

export async function workspaceAliases() {
  const aliases: Record<string, string> = {}
  const workspacePkgs = await readdir(join(__dirname, '../../node_modules/@villagekit'))
  await Promise.all(
    workspacePkgs.map(async (pkgName) => {
      const pkgBase = await realpath(join(__dirname, '../../node_modules/@villagekit', pkgName))
      const pkgJson = JSON.parse(await readFile(join(pkgBase, 'package.json'), 'utf8'))
      type ExportMap = string | { source?: string; import: string }
      if (pkgJson['exports'] == null) return
      const exportEntries = Object.entries<ExportMap>(pkgJson['exports'])
      for (const [exportKey, exportMap] of exportEntries) {
        const aliasKey = join('@villagekit', pkgName, exportKey)
        const aliasTo =
          typeof exportMap === 'string' ? exportMap : exportMap.source || exportMap.import
        const aliasValue = join(pkgBase, aliasTo)
        aliases[aliasKey] = aliasValue
      }
    }),
  )
  return aliases
}
