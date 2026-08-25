import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'pnpm --filter @exile-toolkit/api dev --port 8787',
      reuseExistingServer: true,
      url: 'http://127.0.0.1:8787/health'
    },
    {
      command:
        'pnpm --filter @exile-toolkit/web exec vite preview --host 127.0.0.1 --port 4174',
      reuseExistingServer: false,
      url: 'http://127.0.0.1:4174'
    }
  ],
  projects: [
    {
      name: 'chromium-production',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
