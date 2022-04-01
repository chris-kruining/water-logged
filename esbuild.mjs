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
    // external: [ 'esbuild' ],
    watch: process.argv[2] === 'watch',
});