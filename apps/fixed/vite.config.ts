import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const sharedUi = fileURLToPath(new URL("../../packages/shared-ui/src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@demo/shared-ui": sharedUi,
    },
  },
  build: {
    // No inline scripts in the output, so the strict CSP (script-src 'self')
    // does not need a hash or 'unsafe-inline'.
    modulePreload: { polyfill: false },
  },
  server: {
    port: 3002,
  },
});
