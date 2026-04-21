import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrackingSDK',
      formats: ['umd', 'es'],
      fileName: (format) => `web-tracking-sdk.${format === 'es' ? 'esm' : 'umd'}.js`,
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
  },
});
