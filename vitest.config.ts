import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["dist/**", "coverage/**", "node_modules/**"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true
      }
    },
    coverage: {
      provider: "v8",
      exclude: ["dist/**", "coverage/**", "node_modules/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
