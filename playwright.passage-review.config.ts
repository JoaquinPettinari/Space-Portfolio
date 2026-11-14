import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

export default defineConfig({
  ...base,
  testMatch: [
    'panoramic-passage-review.spec.ts',
    'architecture-v2.spec.ts',
    'warm-interior-review.spec.ts',
    'unified-interior.spec.ts',
    'station.spec.ts',
    'extras.spec.ts',
    'physical-monitor.spec.ts',
  ],
  timeout: 300_000,
  use: { ...base.use, baseURL: 'http://127.0.0.1:4176' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
