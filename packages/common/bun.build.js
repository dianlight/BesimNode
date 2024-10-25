import dts from 'bun-plugin-dts'

// @ts-ignore
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  sourcemap: 'linked',
  plugins: [
    dts()
  ],
})