import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build (includes possible browser code, or anything with o1js)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true, // remove old dist on the first build
    sourcemap: true,
    splitting: false,
    outDir: 'dist',
    target: 'node18', // or consider 'es2020' if you want to keep it more neutral
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      };
    },
    treeshake: true,
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.d.ts', '.js'];
      // For a "universal" or browser-targeted build, you might use 'browser' or keep 'neutral'
      options.platform = 'neutral';
    },
    external: ['socket.io', 'express'],
  },

  // Server-only build (specifically for SignalingServer)
  {
    entry: {
      // The key ("index") becomes the output filename (index.js / index.cjs).
      // You can rename it if you prefer "SignalingServer.js", etc.
      index: 'src/network/SignalingServer.ts',
    },
    format: ['esm', 'cjs'],
    dts: true, // generate .d.ts for the server entry as well
    clean: false, // do NOT clean, or you'll wipe out the first build
    sourcemap: true,
    splitting: false,
    outDir: 'dist/server',
    target: 'node18',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      };
    },
    treeshake: true,
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.d.ts', '.js'];
      // Now we specifically want Node environment (to avoid pulling in any browser globals)
      options.platform = 'node';
    },
    external: ['socket.io', 'express'],
  },
]);
