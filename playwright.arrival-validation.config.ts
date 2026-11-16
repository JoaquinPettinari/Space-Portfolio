import { defineConfig } from '@playwright/test'
import base from './playwright.monitor.config.ts'
// Compatibility entry point: same browser, resolution and budgets as monitor.
export default defineConfig({
  ...base,
  outputDir: 'test-results/arrival-validation',
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: 'playwright-report/arrival-validation' },
    ],
  ],
})
