import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'pnpm --filter @exile-toolkit/api dev --port 8787',
      reuseExistingServer: !process.env.CI,
      url: 'http://127.0.0.1:8787/health'
    },
    {
      command: 'pnpm --filter @exile-toolkit/web dev',
      reuseExistingServer: !process.env.CI,
      url: 'http://127.0.0.1:4173'
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
