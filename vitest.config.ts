import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ は Playwright で回す。
    exclude: ["e2e/**", "node_modules/**"],
  },
});
