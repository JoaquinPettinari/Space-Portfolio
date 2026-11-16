import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
export default defineConfig({
  ...base,
  testMatch: [
    'stable-fps.spec.ts',
    'refined-interior.spec.ts',
    'fps-scenery.spec.ts',
    'interior-orbit-polish.spec.ts',
    'unified-interior.spec.ts',
    'panoramic-passage-review.spec.ts',
    'physical-monitor.spec.ts',
  ],
  timeout: 300_000,
  use: {
    ...base.use,
    baseURL: 'http://127.0.0.1:4177',
    channel: executablePath ? undefined : base.use?.channel,
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4177 --strictPort',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
