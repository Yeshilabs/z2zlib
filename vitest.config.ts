import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/**/*.test.ts", "src/**/**/*.spec.ts"], // Adjust to match your file pattern
    globals: true,
    environment: "node",
  },
});

