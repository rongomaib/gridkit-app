import { readFile, readdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { reverse, sortBy } from 'lodash-es'
import { type BuildOptions, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [tsconfigPaths()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  optimizeDeps: {
    exclude: ['@swc/wasm-web'],
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      ...(await workspaceAliases()),
    },
  },
  build: {
    rollupOptions: {
      onwarn: quietUseClientDirective,
    },
  },
}))

// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
type RollupOnWarn = NonNullable<BuildOptions['rollupOptions']>['onwarn']
const quietUseClientDirective: RollupOnWarn = (warning, warn) => {
  if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes(`"use client"`)) {
    return
  }
  warn(warning)
}

async function workspaceAliases() {
  const aliases: Record<string, string> = {}
  const workspacePkgsDir = join(__dirname, '../../node_modules/@villagekit')
  const workspacePkgs = await readdir(workspacePkgsDir)
  await Promise.all(
    workspacePkgs.map(async (pkgName) => {
      const pkgBase = await realpath(join(workspacePkgsDir, pkgName))
      const pkgJson = JSON.parse(await readFile(join(pkgBase, 'package.json'), 'utf8'))
      type ExportMap = string | { source?: string; import: string }
      if (pkgJson['exports'] == null) return
      let exportEntries = Object.entries<ExportMap>(pkgJson['exports'])
      // NOTE (mw): sort so ./sub comes before ./
      //   important for module like @villagekit/part/base
      exportEntries = reverse(sortBy(exportEntries, ['[0]']))
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
