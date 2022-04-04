# Waterlogged

This is a super simple "library"(a whole single function) for running multiple formats for esbuild in parallel with some pretty logging inspired by Remix' compiler

## Install
`npm i -D @kruining/waterlogged`

**Note** Make sure you have esbuild installed. It is a peer dependency of this lib, 
this is so that you are free to choose the version of esbuild you want to run.

## Usage
`esbuild.mjs`
```ts
import { compile } from './dist/index.mjs';

await compile([ 'esm', 'cjs' ], {
    entryPoints: [ './src/index.ts' ],
    outbase: 'src',
    outfile: 'lib/index.$formatExtension',
    bundle: false,
    sourcemap: true,
    minify: true,
    platform: 'node',
    target: [ 'esnext' ],
    watch: process.argv[2] === 'watch',
});
```

`package.json`
```json
{
    ...,
    "scripts": {
        "build:typed": "node ./esbuild.mjs && tsc",
        "build": "node ./esbuild.mjs",
        "dev": "node ./esbuild.mjs watch",
        ...,
    },
    ...
}
```

**Note**: How you define and set up your watch mode is completely up to you, I simply added it to the docs as an example. 
This library just parallelizes your esbuilds based on the formats given and logs in a fancy format.

## Arguments

| param   | type                           | description                                                           |
|---------|--------------------------------|-----------------------------------------------------------------------|
| formats | `Format[]`                     | an array of formats for esbuild's `format` option, with the same type |
| options | `Omit<BuildOptions, 'format'>` | just esbuild's options object, minus the format option                |

## "Variables"
I have added simple string replacement logic for the `outfile` and `outdir` options. 
`$format` is replaced with the current format.
And `$formatExtionsion` is replaced as per this table:

| format | extension |
|--------|-----------|
| `esm`  | `mjs`     |
| `cjs`  | `cjs`     |
| `iife` | `js`      |