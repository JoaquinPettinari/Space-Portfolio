import { defineConfig } from '@playwright/test'
import base from './playwright.monitor.config.ts'
// Compatibility entry point: same browser, resolution and budgets as monitor.
export default defineConfig({
  ...base,
})
