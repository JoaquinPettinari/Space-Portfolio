import { defineConfig } from '@playwright/test'
import shared from './playwright.shared.config.ts'
import { auditSpecs } from './e2e/suites.ts'

/** Opt-in visual/performance review; some recipes deliberately update docs/audits. */
export default defineConfig({
  ...shared,
  testMatch: auditSpecs,
  timeout: 300_000,
  outputDir: 'test-results/audit',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/audit' }],
  ],
  use: { ...shared.use, baseURL: 'http://127.0.0.1:4178' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4178 --strictPort',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
