import { defineConfig } from 'vite';
import rsc from '@vitejs/plugin-rsc';

export default defineConfig({
  plugins: [
    rsc({
      serverHandler: false, // We handle server ourselves with Hono
    }),
  ],
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: './src/entry.rsc.tsx',
            mixed: './src/entry-mixed.rsc.tsx',
          },
        },
        outDir: './dist/rsc',
      },
    },
    // Minimal client/ssr entries required by plugin build process
    client: {
      build: {
        rollupOptions: {
          input: {
            index: './src/entry.client.tsx',
          },
        },
        outDir: './dist/client',
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: './src/entry.ssr.tsx',
          },
        },
        outDir: './dist/ssr',
      },
    },
  },
});

