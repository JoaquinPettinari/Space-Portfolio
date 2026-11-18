import { defineConfig } from '@playwright/test'
import shared from '../../../playwright.shared.config'

export default defineConfig({
  ...shared,
  testDir: '../../../e2e',
  testMatch: 'cabin-master.spec.ts',
  timeout: 240_000,
  outputDir: '../../../test-results/cabin-master',
  reporter: [['list']],
})
