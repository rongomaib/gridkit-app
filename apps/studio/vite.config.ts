import { readFile, readdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { type BuildOptions, defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import _tsconfigPaths from 'vite-tsconfig-paths'
// vite-tsconfig-paths ships CJS; Node ESM gives us module.exports as default (not unwrapped)
const tsconfigPaths = (typeof _tsconfigPaths === 'function'
  ? _tsconfigPaths
  : (_tsconfigPaths as any).default) as typeof _tsconfigPaths

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
      },
      manifest: {
        name: 'Grid Kit Studio',
        short_name: 'Studio',
        theme_color: '#ffffff',
        display: 'standalone',
      },
    }),
  ],
  define: {
    'process.env': process.env,
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
    // Pre-bundle these so Vite doesn't discover them lazily at runtime and reload.
    include: ['@typescript/vfs', 'typescript', '@valtown/codemirror-ts/worker'],
    // Exclude WASM packages from pre-bundling — they rely on import.meta.url
    // to locate the .wasm binary at runtime, which esbuild's pre-bundler breaks.
    // es-module-lexer is already ESM and fails esbuild resolution; exclude so Vite
    // doesn't treat it as a new discovery and reload when it's first imported.
    exclude: ['@swc/wasm-web', 'gridkit-solver', 'es-module-lexer'],
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

  // Collect candidate @villagekit dirs: direct deps + their own node_modules
  // (catches transitive workspace packages like @villagekit/sandbox).
  const directPkgsDir = join(__dirname, './node_modules/@villagekit')
  const directPkgs = await readdir(directPkgsDir)

  const candidateDirs = new Set<string>()
  candidateDirs.add(directPkgsDir)
  await Promise.all(
    directPkgs.map(async (pkgName) => {
      const pkgBase = await realpath(join(directPkgsDir, pkgName))
      const transDir = join(pkgBase, 'node_modules/@villagekit')
      try {
        await readdir(transDir)
        candidateDirs.add(transDir)
      } catch {
        // package has no nested @villagekit node_modules — skip
      }
    }),
  )

  type ExportMap = string | { source?: string; import: string }

  async function addAliasesFromDir(pkgsDir: string) {
    const pkgNames = await readdir(pkgsDir)
    await Promise.all(
      pkgNames.map(async (pkgName) => {
        const pkgBase = await realpath(join(pkgsDir, pkgName))
        const pkgJsonRaw = await readFile(join(pkgBase, 'package.json'), 'utf8').catch(() => null)
        if (!pkgJsonRaw) return
        const pkgJson = JSON.parse(pkgJsonRaw.replace(/^﻿/, ''))
        if (pkgJson['exports'] == null) return
        let exportEntries = Object.entries<ExportMap>(pkgJson['exports'])
        // sort so ./sub comes before ./ — important for @villagekit/part/base style imports
        exportEntries = exportEntries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).reverse()
        for (const [exportKey, exportMap] of exportEntries) {
          const aliasKey = join('@villagekit', pkgName, exportKey).replace(/\\/g, '/')
          const aliasTo =
            typeof exportMap === 'string' ? exportMap : exportMap.source || exportMap.import
          if (!aliasTo) continue
          // Don't overwrite an alias already set by a higher-priority (direct dep) dir
          if (!(aliasKey in aliases)) {
            aliases[aliasKey] = join(pkgBase, aliasTo)
          }
        }
      }),
    )
  }

  // Direct deps first (higher priority), then transitive
  await addAliasesFromDir(directPkgsDir)
  for (const dir of candidateDirs) {
    if (dir !== directPkgsDir) await addAliasesFromDir(dir)
  }

  return aliases
}
