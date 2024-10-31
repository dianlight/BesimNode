//import { dts } from '@anymud/bun-plugin-dts'
//import dts from 'bun-plugin-dts'
import isolatedDecl from 'bun-plugin-isolated-decl';
import { generate } from '@stacksjs/dtsx';
import type { DtsGenerationOptions } from '@stacksjs/dtsx'

// @ts-ignore
const result = await Bun.build({
  entrypoints: ['./src/index.ts', './src/data-source.ts', './src/db/schema/devices.ts', './src/db/schema/movies.ts'],
  outdir: './dist',
  target: 'bun',
  sourcemap: 'linked',
  //naming: "[dir]/[name]-[hash].[ext]",
  plugins: [
    //dts()
    //isolatedDecl()
  ],
})

const options: DtsGenerationOptions = {
  cwd: process.cwd(), // default: './', // default: process.cwd()
  root: './src', // default: './src'
  entrypoints: ['**/*.ts'], // default: ['**/*.ts']
  outdir: './dist', // default: './dist'
  keepComments: true, // default: true
  clean: true, // default: false
}

await generate();

if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    // Bun will pretty print the message object
    console.error(message);
  }
}

console.log('Build complete ✅')