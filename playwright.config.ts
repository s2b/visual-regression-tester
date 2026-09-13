import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  retries: 0,
  reporter: [["dot"], ["@praetorius/visual-regression-tester/reporter"]],
  use: {
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },
  globalSetup: ["@praetorius/visual-regression-tester/collector"],
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
