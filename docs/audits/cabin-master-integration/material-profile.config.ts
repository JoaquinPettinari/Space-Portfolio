import { defineConfig } from '@playwright/test'
import shared from '../../../playwright.shared.config'
export default defineConfig({
  ...shared,
  testDir: '.',
  testMatch: 'material-profile.spec.ts',
  timeout: 180000,
  outputDir: '../../../test-results/material-profile',
  reporter: [['list']],
})
