import type { Page } from '@playwright/test'

/** Observe the unmodified scene through the development diagnostics and Chromium's
 * public DevTools Protocol. No renderer roots, DPR changes or raycast overrides. */
export async function profileBridge(page: Page) {
  const client = await page.context().newCDPSession(page)
  try {
    await client.send('Profiler.enable')
    await client.send('Profiler.start')
    const measurement = await page.evaluate(async () => {
      const frame = () =>
        new Promise<number>((resolve) => requestAnimationFrame(resolve))
      for (let i = 0; i < 40; i++) await frame()
      const samples = []
      let previous = await frame()
      for (let i = 0; i < 120; i++) {
        const now = await frame()
        const diagnostics = window.__GAME_DEBUG__
        if (!diagnostics)
          throw new Error('Development diagnostics are unavailable')
        samples.push({ ...diagnostics.performance(), rafMs: now - previous })
        previous = now
      }
      const times = samples.map(({ frameMs }) => frameMs).sort((a, b) => a - b)
      return {
        kind: 'observational' as const,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          browserDpr: devicePixelRatio,
        },
        browser: navigator.userAgent,
        meanMs: times.reduce((sum, value) => sum + value, 0) / times.length,
        medianMs: times[Math.floor(times.length * 0.5)],
        p95Ms: times[Math.floor(times.length * 0.95)],
        p99Ms: times[Math.floor(times.length * 0.99)],
        samples,
      }
    })
    const { profile } = await client.send('Profiler.stop')
    return { ...measurement, cpuProfile: profile }
  } finally {
    try {
      await client.send('Profiler.disable')
    } finally {
      await client.detach()
    }
  }
}
