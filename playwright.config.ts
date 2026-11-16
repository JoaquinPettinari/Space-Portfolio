import { defineConfig } from '@playwright/test'
import shared from './playwright.shared.config.ts'
import { regressionSpecs } from './e2e/suites.ts'

export default defineConfig({
  ...shared,
  testMatch: regressionSpecs,
  outputDir: 'test-results/regression',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/regression' }],
  ],
})
