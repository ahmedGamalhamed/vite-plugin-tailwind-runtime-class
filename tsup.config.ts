import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    entry: ['src/index.ts', 'src/virtual-module.d.ts'],
  },
  clean: true,
  sourcemap: true,
  minify: false,
  external: ['vite', 'fast-glob'],
  target: 'node16',
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
      dts: '.d.ts',
    };
  },
});