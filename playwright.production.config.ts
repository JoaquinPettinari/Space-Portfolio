import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'production.spec.ts',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', browserName: 'chromium' },
  webServer: {
    command:
      'npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
