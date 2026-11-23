import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

interface CpuNode {
  id: number
  children?: number[]
  callFrame: { functionName: string; url: string; lineNumber: number }
}
interface CpuProfile {
  nodes: CpuNode[]
  samples?: number[]
  timeDeltas?: number[]
  startTime: number
  endTime: number
}
interface StartupMeasurements {
  longTasks: Record<string, unknown>[]
  marks: Record<string, number>
}
declare global {
  interface Window {
    __STARTUP_REVIEW__?: StartupMeasurements
  }
}

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  trace: 'off',
  video: 'off',
  screenshot: 'only-on-failure',
})

function summarize(profile: CpuProfile) {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]))
  const parents = new Map<number, number>()
  for (const node of profile.nodes)
    for (const child of node.children ?? []) parents.set(child, node.id)
  const self = new Map<number, number>()
  const inclusive = new Map<number, number>()
  for (const [index, id] of (profile.samples ?? []).entries()) {
    const ms = (profile.timeDeltas?.[index] ?? 0) / 1000
    self.set(id, (self.get(id) ?? 0) + ms)
    let ancestor: number | undefined = id
    while (ancestor !== undefined) {
      inclusive.set(ancestor, (inclusive.get(ancestor) ?? 0) + ms)
      ancestor = parents.get(ancestor)
    }
  }
  const top = (values: Map<number, number>) =>
    [...values]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 45)
      .map(([id, ms]) => ({ ...nodes.get(id)?.callFrame, ms }))
  return { self: top(self), inclusive: top(inclusive) }
}

const runCount = Number(process.env.STARTUP_REVIEW_RUNS ?? 2)
for (let run = 1; run <= runCount; run++) {
  test(`cold startup CPU and resource attribution ${run}`, async ({
    page,
  }, info) => {
    test.setTimeout(240_000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const session = await page.context().newCDPSession(page)
    await session.send('Network.enable')
    await session.send('Network.setCacheDisabled', { cacheDisabled: true })
    await session.send('Network.setBypassServiceWorker', { bypass: true })
    await session.send('Performance.enable')
    await session.send('Profiler.enable')
    await session.send('Profiler.setSamplingInterval', { interval: 5000 })
    await page.addInitScript(() => {
      performance.setResourceTimingBufferSize(2000)
      const measurements: StartupMeasurements = { longTasks: [], marks: {} }
      window.__STARTUP_REVIEW__ = measurements
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          measurements.longTasks.push(entry.toJSON() as Record<string, unknown>)
      }).observe({ type: 'longtask', buffered: true })
      document.addEventListener('DOMContentLoaded', () => {
        measurements.marks.domContentLoaded = performance.now()
        const inspect = () => {
          if (
            document.querySelector('canvas') &&
            !measurements.marks.canvasMounted
          )
            measurements.marks.canvasMounted = performance.now()
          const controls = document.querySelector(
            '[aria-label="Game controls"]',
          )
          if (
            controls instanceof HTMLElement &&
            controls.offsetWidth > 0 &&
            !measurements.marks.controlsVisible
          )
            measurements.marks.controlsVisible = performance.now()
          if (measurements.marks.controlsVisible) observer.disconnect()
        }
        const observer = new MutationObserver(inspect)
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
        })
        inspect()
      })
    })
    const before = await session.send('Performance.getMetrics')
    await session.send('Profiler.start')
    const wallStart = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Game controls')).toBeVisible({
      timeout: 180_000,
    })
    const readyWallMs = Date.now() - wallStart
    const stopped = (await session.send('Profiler.stop')) as {
      profile: CpuProfile
    }
    const after = await session.send('Performance.getMetrics')
    const browser = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      const gl = canvas?.getContext('webgl2')
      const debug = gl?.getExtension('WEBGL_debug_renderer_info')
      return {
        userAgent: navigator.userAgent,
        dpr: devicePixelRatio,
        viewport: [innerWidth, innerHeight],
        renderer:
          gl && debug
            ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
            : null,
        observations: window.__STARTUP_REVIEW__,
        navigation: performance
          .getEntriesByType('navigation')
          .map((entry) => entry.toJSON()),
        resources: performance
          .getEntriesByType('resource')
          .map((entry) => entry.toJSON()),
        paints: performance
          .getEntriesByType('paint')
          .map((entry) => entry.toJSON()),
      }
    })
    const result = {
      run,
      mode: process.env.STARTUP_REVIEW_MODE ?? 'development',
      method:
        'Fresh Playwright context; HTTP cache disabled; service workers bypassed; no network/CPU throttling; CDP CPU sampling 5ms; OS disk cache and browser-process shader caches not cleared',
      readyWallMs,
      browser,
      performanceMetrics: { before: before.metrics, after: after.metrics },
      cpu: summarize(stopped.profile),
      errors,
    }
    await writeFile(
      info.outputPath('startup.json'),
      JSON.stringify(result, null, 2),
    )
    await writeFile(
      info.outputPath('startup.cpuprofile'),
      JSON.stringify(stopped.profile),
    )
    await page.screenshot({ path: info.outputPath('ready.png') })
    await info.attach('startup', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
    expect(errors).toEqual([])
  })
}
