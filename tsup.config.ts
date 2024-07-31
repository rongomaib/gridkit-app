import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'
import esbuildRawPlugin from 'esbuild-plugin-raw'
import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: true,
  clean: true,
  dts: true,
  esbuildPlugins: [
    esbuildRawPlugin(),
    esbuildPluginFilePathExtensions({
      esm: true,
      esmExtension: 'js',
    }),
  ],
  format: ['esm'],
  sourcemap: true,
  splitting: false,
  target: 'es2022',
})
