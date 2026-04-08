import { defineConfig } from "vite";
import path from "path";

// Resolve workspace packages directly from TypeScript source so Vite
// handles compilation itself — no separate tsc --watch needed, and
// changes to any package source file trigger full HMR instantly.
export default defineConfig({
  resolve: {
    alias: {
      "@wrafjs/parser":   path.resolve(__dirname, "../../packages/parser/src/index.ts"),
      "@wrafjs/controls": path.resolve(__dirname, "../../packages/controls/src/index.ts"),
      "@wrafjs/layout":   path.resolve(__dirname, "../../packages/layout/src/index.ts"),
      "@wrafjs/renderer": path.resolve(__dirname, "../../packages/renderer/src/index.ts"),
    },
  },
  server: {
    watch: {
      // Ensure .wraf example files and package source files are watched.
      // On Windows, native FSEvents can miss changes from external editors.
      usePolling: false,
    },
  },
});
