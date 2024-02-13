import { defineConfig } from 'tsup'

export default defineConfig((option) => ({
  entry: ['src/cli.ts', 'src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: !option.watch,
  target: 'node16',
  cjsInterop: true,
}))
