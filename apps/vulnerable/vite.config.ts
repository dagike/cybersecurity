import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Shared components are consumed as source; alias to the package's src folder
// so Vite transpiles them directly (no build step in the workspace package).
const sharedUi = fileURLToPath(new URL("../../packages/shared-ui/src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@demo/shared-ui": sharedUi,
    },
  },
  server: {
    port: 3001,
  },
});
