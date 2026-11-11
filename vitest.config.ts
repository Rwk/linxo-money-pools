import { defineConfig } from "vitest/config";

export default defineConfig({
  // Unit tests use explicit process/mocked settings, never local application secrets.
  envDir: false,
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": "/src",
      "server-only": "/src/tests/test-support/server-only.ts"
    }
  }
});
