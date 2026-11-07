import { defineConfig, devices } from '@playwright/test'

/** Manual visual review only: this suite never records screenshots or videos. */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'physical-monitor.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 150_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
