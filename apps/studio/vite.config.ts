import { readFile, readdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { reverse, sortBy } from 'lodash-es'
import { type BuildOptions, defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 // 50MB
      },
      manifest: {
        name: 'Grid Kit Studio',
        short_name: 'Studio',
        theme_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
  define: {
    'process.env': process.env
  },

  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || '0.0.0.0',
    port: 5173,
  },

  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,

    rollupOptions: {
      onwarn: quietUseClientDirective,
    },
  },

  optimizeDeps: {
    exclude: ['@swc/wasm-web'],
  },
  worker: {
    format: 'es',
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      ...(await workspaceAliases()),
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
  const workspacePkgsDir = join(__dirname, './node_modules/@villagekit')
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
        // Use forward slashes in the alias key — path.join uses backslashes on Windows
        // but Vite matches aliases against import strings which always use forward slashes.
        const aliasKey = join('@villagekit', pkgName, exportKey).replace(/\\/g, '/')
        const aliasTo =
          typeof exportMap === 'string' ? exportMap : exportMap.source || exportMap.import
        const aliasValue = join(pkgBase, aliasTo)
        aliases[aliasKey] = aliasValue
      }
    }),
  )
  return aliases
}
