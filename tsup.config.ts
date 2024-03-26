import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'
import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: true,
  clean: true,
  dts: true,
  esbuildPlugins: [esbuildPluginFilePathExtensions()],
  format: ['esm'],
  sourcemap: true,
  splitting: false,
  target: 'es2019',
})
