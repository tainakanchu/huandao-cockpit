import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: "http://localhost:8082",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        viewport: { width: 390, height: 844 }, // iPhone 14 size
      },
    },
  ],
  outputDir: "e2e/test-results",
});
