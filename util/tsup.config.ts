import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  format: ['cjs', 'esm'],
  target: 'es2019',
  sourcemap: true,
  clean: true,
})
