import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  target: 'node18',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    };
  },
  treeshake: true,
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.d.ts', '.js'];
    options.platform = 'neutral'; 
  },
  external: ['socket.io', 'express'] 
});