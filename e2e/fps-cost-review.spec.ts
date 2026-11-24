import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { measureFrames } from './helpers/performance'
import { enter, enterObservationRoom, lookAt, walkTo } from './helpers/game'

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  screenshot: 'off',
  video: 'off',
  trace: 'off',
})
test.setTimeout(420_000)

test('profiles frame cost at fixed native arrival, bridge and passage poses', async ({
  page,
}) => {
  const phase = process.env.FPS_COST_PHASE ?? 'before'
  if (!['before', 'cpu-bvh', 'after'].includes(phase))
    throw new Error('Invalid FPS_COST_PHASE')
  const directory = 'docs/audits/fps-cost'
  await mkdir(directory, { recursive: true })
  const errors: string[] = [],
    warnings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Performance.enable')
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 })
  await page.addInitScript(() => performance.setResourceTimingBufferSize(4000))
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120_000,
  })
  await enter(page)
  const views: object[] = []
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    const trials = []
    for (let trial = 0; trial < 3; trial++)
      trials.push(await measureFrames(page))
    const inventory = await page.evaluate(() => ({
      render: window.__GAME_DEBUG__!.renderInventory(),
      materials: window.__GAME_DEBUG__!.materialInventory(),
    }))
    await page.screenshot({ path: `${directory}/${phase}-${name}.png` })
    const metricsBefore = await cdp.send('Performance.getMetrics')
    await cdp.send('Profiler.start')
    await page.waitForTimeout(5000)
    const { profile } = await cdp.send('Profiler.stop')
    const metricsAfter = await cdp.send('Performance.getMetrics')
    const times = new Map<number, number>()
    profile.samples?.forEach((id, index) =>
      times.set(id, (times.get(id) ?? 0) + (profile.timeDeltas?.[index] ?? 0)),
    )
    const functions = profile.nodes
      .map((node) => ({
        function: node.callFrame.functionName || '(anonymous)',
        // File pathname only: no origin, query parameters or user-specific URLs.
        file: node.callFrame.url
          ? (() => {
              try {
                return new URL(node.callFrame.url).pathname
              } catch {
                return node.callFrame.url.split('?')[0]
              }
            })()
          : '',
        line: node.callFrame.lineNumber + 1,
        selfMs: (times.get(node.id) ?? 0) / 1000,
      }))
      .filter((entry) => entry.selfMs > 0)
      .sort((a, b) => b.selfMs - a.selfMs)
    const metricDeltas = Object.fromEntries(
      metricsAfter.metrics.map(({ name, value }) => [
        name,
        value -
          (metricsBefore.metrics.find((metric) => metric.name === name)
            ?.value ?? 0),
      ]),
    )
    const cpu = {
      durationMs: (profile.endTime - profile.startTime) / 1000,
      functions,
      metricDeltas,
    }
    await writeFile(
      `${directory}/${phase}-${name}-cpu.json`,
      JSON.stringify(cpu, null, 2) + '\n',
    )
    views.push({ name, trials, inventory, cpu })
    await writeFile(
      `${directory}/${phase}-partial.json`,
      JSON.stringify({ phase, views, errors, warnings }, null, 2) + '\n',
    )
    console.log(
      'FPS_COST_VIEW',
      JSON.stringify({
        name,
        trials: trials.map((trial) => ({ ...trial, samples: undefined })),
        cpuTop: functions.slice(0, 12),
      }),
    )
  }
  await walkTo(page, 0, 15.15)
  await capture('arrival-port', { x: -8, y: 1.7, z: 15.15 })
  await enterObservationRoom(page)
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, -2.4, -4.35)
  await capture('bow-forward', { x: 0, y: 1.85, z: -12 })
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, 0, 1.5)
  await walkTo(page, 0, 8.15)
  await capture('passage-port', { x: -5, y: 1.8, z: 8.15 })
  const environment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!
    const gl = canvas.getContext('webgl2')!
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      userAgent: navigator.userAgent,
      renderer: debug
        ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
        : 'unknown',
      viewport: [innerWidth, innerHeight],
      canvas: [canvas.width, canvas.height],
      gpuTimerQuerySupported:
        gl
          .getSupportedExtensions()
          ?.includes('EXT_disjoint_timer_query_webgl2') ?? false,
      gpuTimingMeasured: false,
      resources: performance.getEntriesByType('resource').map((entry) => {
        const resource = entry as PerformanceResourceTiming
        return {
          path: new URL(resource.name).pathname,
          encodedBytes: resource.encodedBodySize,
          transferBytes: resource.transferSize,
          durationMs: resource.duration,
        }
      }),
    }
  })
  await writeFile(
    `${directory}/${phase}.json`,
    JSON.stringify({ phase, environment, views, errors, warnings }, null, 2) +
      '\n',
  )
  expect(errors).toEqual([])
})
