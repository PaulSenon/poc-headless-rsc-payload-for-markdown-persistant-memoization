import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";
import rscBrowser from "./src/lib/rsc-browser-plugin";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    // Custom RSC browser plugin (sets appType: 'spa', configures RSC environment)
    rscBrowser(),
    // RSC plugin - configure both rsc and client entries
    // Client entry is needed so plugin can scan for client components and generate client-references map
    rsc({
      serverHandler: false,
      entries: {
        client: './src/main.tsx', // Client entry for scanning client components
        rsc: './src/entry.rsc.tsx',
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
