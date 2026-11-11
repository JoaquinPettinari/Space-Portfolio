import { expect, test } from '@playwright/test'
import { enter } from './helpers/game'

test('measures arrival render and diagnostic costs without changing scene state', async ({
  page,
}, info) => {
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enter(page)
  const result = await page.evaluate(async () => {
    const frame = () =>
      new Promise<number>((resolve) => requestAnimationFrame(resolve))
    for (let i = 0; i < 5; i++) await frame()
    const intervals: number[] = []
    let previous = await frame()
    for (let i = 0; i < 24; i++) {
      const now = await frame()
      intervals.push(now - previous)
      previous = now
    }
    const diagnosticCosts: number[] = []
    for (let i = 0; i < 12; i++) {
      const start = performance.now()
      window.__GAME_DEBUG__!.snapshot()
      diagnosticCosts.push(performance.now() - start)
      await frame()
    }
    const gl = document.querySelector('canvas')!.getContext('webgl2')!
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      renderer: extension
        ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
        : 'unknown',
      viewport: [innerWidth, innerHeight],
      intervals,
      diagnosticCosts,
      state: window.__GAME_DEBUG__!.snapshot(),
    }
  })
  const percentile = (values: number[], p: number) =>
    [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)]
  console.log(
    'ARRIVAL_PROFILE',
    JSON.stringify({
      renderer: result.renderer,
      viewport: result.viewport,
      medianFrameMs: percentile(result.intervals, 0.5),
      p95FrameMs: percentile(result.intervals, 0.95),
      medianSnapshotMs: percentile(result.diagnosticCosts, 0.5),
      p95SnapshotMs: percentile(result.diagnosticCosts, 0.95),
      drawCalls: result.state.drawCalls,
      triangles: result.state.triangles,
      resources: result.state.resources,
    }),
  )
  await info.attach('arrival-profile', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  })
  expect(result.state.pointerLocked).toBe(true)
  expect(result.intervals).toHaveLength(24)
})
