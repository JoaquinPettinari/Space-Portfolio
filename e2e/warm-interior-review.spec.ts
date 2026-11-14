import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('records warm interior appearance and render cost from native gameplay', async ({
  page,
}, info) => {
  test.setTimeout(240_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 60_000,
  })
  await enter(page)
  await lookAt(page, { x: 1, y: 1.9, z: 12 })
  await page.screenshot({ path: info.outputPath('unified-arrival-entry.png') })
  const measure = () =>
    page.evaluate(async () => {
      const frame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      for (let i = 0; i < 30; i++) await frame()
      const samples = []
      for (let i = 0; i < 90; i++) {
        await frame()
        samples.push(window.__GAME_DEBUG__!.performance())
      }
      const state = window.__GAME_DEBUG__!.snapshot()
      const gl = document.querySelector('canvas')?.getContext('webgl2')
      const extension = gl?.getExtension('WEBGL_debug_renderer_info')
      const times = samples
        .map((sample) => sample.frameMs)
        .sort((a, b) => a - b)
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
        medianMs: times[45],
        p95Ms: times[85],
        drawCalls: samples[45].drawCalls,
        triangles: samples[45].triangles,
        samples,
      }
    })
  const measurements = [{ name: 'arrival-entry', ...(await measure()) }]
  await enterObservationRoom(page)
  await walkTo(page, 0, 0.6)
  for (const [name, target] of [
    ['bridge-forward', { x: 0, y: 1.7, z: -12 }],
    ['bridge-rear', { x: 0, y: 1.7, z: 8 }],
  ] as const) {
    await lookAt(page, target)
    const measurement = await measure()
    measurements.push({ name, ...measurement })
    await page.screenshot({ path: info.outputPath(`${name}.png`) })
    expect(measurement.samples.every((sample) => sample.drawCalls > 0)).toBe(
      true,
    )
  }
  await writeFile(
    info.outputPath('warm-interior-measurements.json'),
    JSON.stringify(measurements, null, 2),
  )
  console.log(
    'WARM_INTERIOR_REVIEW',
    JSON.stringify(
      measurements.map(({ samples, ...measurement }) => ({
        ...measurement,
        samples: samples.length,
      })),
    ),
  )
  await walkTo(page, 2.4, -0.05)
  await lookAt(page, { x: 2.85, y: 1.8, z: 1.6 })
  await page.screenshot({ path: info.outputPath('amber-niche-closeup.png') })
  await walkTo(page, 2.2, -1.4)
  await lookAt(page, { x: 4.05, y: 1.4, z: -0.38 })
  await page.screenshot({ path: info.outputPath('console-plant-closeup.png') })
  await lookAt(page, { x: 3.2, y: 0.95, z: -1.05 })
  await page.screenshot({ path: info.outputPath('seat-closeup.png') })
  await walkTo(page, 0, 0.6)
  await walkTo(page, 2.5, -4.3)
  await walkTo(page, 0, -5.2)
  await lookAt(page, { x: 0, y: -0.4, z: -20 })
  await page.screenshot({ path: info.outputPath('player-ship-bow-window.png') })
  await walkTo(page, 2.5, -4.3)
  await walkTo(page, 2.5, -0.5)
  await walkTo(page, 0, 0.6)
  await lookAt(page, { x: -3.1, y: 1.7, z: 1.55 })
  await page.screenshot({
    path: info.outputPath('decorative-alcove-no-cv.png'),
  })
  await expect(
    page.getByText('E · Download crew dossier (CV / PDF)', { exact: true }),
  ).not.toBeVisible()
  await walkTo(page, 0, 6.3)
  await lookAt(page, { x: 3.97, y: 1.3, z: 1.965 })
  await page.screenshot({
    path: info.outputPath('passage-sealed-niche-back.png'),
  })
  await walkTo(page, 0, 14.5)
  await lookAt(page, { x: 3.8, y: 1.9, z: 13.8 })
  await page.screenshot({ path: info.outputPath('unified-arrival-ribs.png') })
  await lookAt(page, { x: -4, y: 0.55, z: 16 })
  await page.screenshot({ path: info.outputPath('arrival-bench-cleanup.png') })
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
