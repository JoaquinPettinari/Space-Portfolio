import { defineConfig } from '@playwright/test'
import base from './playwright.monitor.config'
// Reduced pixel load for software-rendered integration checks. This does not
// replace the default 1280x720 suite or establish hardware performance.
export default defineConfig({
  ...base,
  metadata: { softwareRenderingValidation: true },
  use: { ...base.use, viewport: { width: 800, height: 450 } },
})
