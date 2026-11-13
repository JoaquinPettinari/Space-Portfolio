import { BRIDGE_OFFSET_Z } from '../src/game/world/bridgePlacement'
import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'

// Full walking circuit plus 90 rendered samples can exceed 150 s on SwiftShader.
// Individual movement/collision expectations retain their bounded timeouts.
test.setTimeout(240_000)

test('bridge circulation, table, faceted hull and jump retain real collision', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await walkTo(page, 0, 3.3 + BRIDGE_OFFSET_Z)

  // Centered table stops the capsule; its two side corridors stay connected.
  await lookAt(page, { x: 0, y: 1.7, z: -4 + BRIDGE_OFFSET_Z })
  await page.keyboard.down('w')
  await page.waitForTimeout(1300)
  await page.keyboard.up('w')
  const blocked = (await snapshot(page)).cameraPosition
  expect(blocked.z).toBeGreaterThan(2.1 + BRIDGE_OFFSET_Z)
  expect(blocked.z).toBeLessThan(2.3 + BRIDGE_OFFSET_Z)
  await walkTo(page, 2.4, 3.1 + BRIDGE_OFFSET_Z)
  await walkTo(page, 2.4, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, -2.4, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, -2.4, 2.7 + BRIDGE_OFFSET_Z)
  await page.keyboard.press('Space')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeGreaterThan(2)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.75)

  await walkTo(page, -2.4, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, -4.35, -1.2 + BRIDGE_OFFSET_Z)
  await lookAt(page, { x: -6, y: 1.7, z: -1.2 + BRIDGE_OFFSET_Z })
  await page.keyboard.down('w')
  await page.waitForTimeout(1000)
  await page.keyboard.up('w')
  expect((await snapshot(page)).cameraPosition.x).toBeGreaterThan(-4.75)
  await walkTo(page, -4.4, -2.2 + BRIDGE_OFFSET_Z)
  await lookAt(page, { x: -5.5, y: 1.7, z: -5.5 + BRIDGE_OFFSET_Z })
  await page.keyboard.down('w')
  await page.waitForTimeout(1800)
  await page.keyboard.up('w')
  const bow = (await snapshot(page)).cameraPosition
  expect(bow.z).toBeLessThan(-3.2 + BRIDGE_OFFSET_Z)
  expect(bow.x + bow.z).toBeGreaterThan(-8.65 + BRIDGE_OFFSET_Z)

  await walkTo(page, -4.3, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, -2.4, 3.1 + BRIDGE_OFFSET_Z)
  await walkTo(page, 0, 3.8 + BRIDGE_OFFSET_Z)
  await walkTo(page, 0, 6.8)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await walkTo(page, 0, 3.5 + BRIDGE_OFFSET_Z)
  await lookAt(page, { x: 0, y: 1.7, z: -4 + BRIDGE_OFFSET_Z })
  const samples = await page.evaluate(async () => {
    const values = []
    for (let i = 0; i < 90; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      const s = window.__GAME_DEBUG__!.snapshot()
      values.push({
        frameMs: s.frameMs,
        drawCalls: s.drawCalls,
        triangles: s.triangles,
      })
    }
    return values
  })
  const sorted = samples.map((s) => s.frameMs).sort((a, b) => a - b)
  const renderer = await page.locator('canvas').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error('Canvas unavailable')
    const gl = canvas.getContext('webgl2')
    const debug = gl?.getExtension('WEBGL_debug_renderer_info')
    return gl && debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : 'unavailable'
  })
  const measurement = {
    viewport: '1280x720',
    renderer,
    samples: samples.length,
    medianFrameMs: sorted[45],
    p95FrameMs: sorted[85],
    drawCalls: samples.at(-1)?.drawCalls,
    triangles: samples.at(-1)?.triangles,
  }
  console.log('BRIDGE_MEASUREMENT', JSON.stringify(measurement))
  await info.attach('bridge-render-measurement', {
    body: JSON.stringify(measurement),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})
