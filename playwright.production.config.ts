import { defineConfig } from '@playwright/test'
import shared from './playwright.shared.config.ts'
import { productionSpecs } from './e2e/suites.ts'

export default defineConfig({
  ...shared,
  testMatch: productionSpecs,
  outputDir: 'test-results/production',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/production' }],
  ],
  workers: 1,
  use: {
    ...shared.use,
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
  },
  webServer: {
    command:
      'npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
