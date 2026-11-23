import { createServer } from 'vite'
import { chromium } from '@playwright/test'
const server = await createServer({
  server: { port: 4188, host: '127.0.0.1', strictPort: true },
})
await server.listen()
const browser = await chromium.launch({
  executablePath:
    'C:/Users/joaqu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
})
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 644 },
    deviceScaleFactor: 1,
  })
  page.on('pageerror', (e) => console.error(e.message))
  await page.goto(
    'http://127.0.0.1:4188/docs/assets/astronaut-hands/check-sheen.html',
  )
  await page.waitForFunction(() => window.done, {}, { timeout: 120000 })
  await page.screenshot({
    path: 'docs/assets/astronaut-hands/sheen-comparison.png',
  })
  console.log('SHEEN_COMPARISON_READY')
} finally {
  await browser.close()
  await server.close()
}
