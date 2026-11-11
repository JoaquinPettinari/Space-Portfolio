import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot } from './helpers/game'

test.setTimeout(180000)
test('measures the roof from a repeatable native gameplay view', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text() + ' @ ' + m.location().url)
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await lookAt(page, { x: 0, y: 3.2, z: -6 })
  const result = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 30; i++) await frame()
    const samples = []
    for (let i = 0; i < 90; i++) {
      await frame()
      const s = window.__GAME_DEBUG__!.snapshot()
      samples.push({
        frameMs: s.frameMs,
        drawCalls: s.drawCalls,
        triangles: s.triangles,
      })
    }
    const state = window.__GAME_DEBUG__!.snapshot()
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const extension = gl?.getExtension('WEBGL_debug_renderer_info')
    const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
    return {
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      renderer:
        gl && extension
          ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
          : 'unknown',
      position: state.cameraPosition,
      rotation: state.cameraRotation,
      resources: state.resources,
      medianFrameMs: times[45],
      p95FrameMs: times[85],
      samples,
    }
  })
  console.log(
    'ROOF_MEASUREMENT',
    JSON.stringify({
      ...result,
      samples: result.samples.length,
      drawCalls: result.samples[0].drawCalls,
      triangles: result.samples[0].triangles,
    }),
  )
  await info.attach('roof-render-measurement', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  })
  expect(result.samples).toHaveLength(90)
  expect(result.samples.every((s) => s.drawCalls > 0 && s.triangles > 0)).toBe(
    true,
  )
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
