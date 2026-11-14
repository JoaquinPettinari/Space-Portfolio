import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews the panoramic passage through real gameplay and records render cost', async ({
  page,
}, info) => {
  test.setTimeout(300_000)
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
  await enterObservationRoom(page)
  await walkTo(page, 0, 8.15)
  await lookAt(page, { x: -15, y: 1.8, z: 8.15 })
  const measurement = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 20; i++) await frame()
    const samples = []
    for (let i = 0; i < 90; i++) {
      await frame()
      samples.push(window.__GAME_DEBUG__!.performance())
    }
    const state = window.__GAME_DEBUG__!.snapshot()
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const extension = gl?.getExtension('WEBGL_debug_renderer_info')
    const times = samples.map((sample) => sample.frameMs).sort((a, b) => a - b)
    return {
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      renderer:
        gl && extension
          ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
          : 'unknown',
      position: state.cameraPosition,
      resources: state.resources,
      medianMs: times[45],
      p95Ms: times[85],
      samples,
    }
  })
  await info.attach('passage-render-measurement', {
    body: JSON.stringify(measurement, null, 2),
    contentType: 'application/json',
  })
  await writeFile(
    info.outputPath('passage-measurement.json'),
    JSON.stringify(measurement, null, 2),
  )
  await info.attach('passage-through-glass', {
    body: await page.screenshot({
      path: info.outputPath('passage-through-glass.png'),
    }),
    contentType: 'image/png',
  })
  console.log(
    'PASSAGE_REVIEW',
    JSON.stringify({
      ...measurement,
      samples: measurement.samples.length,
      drawCalls: measurement.samples[0].drawCalls,
      triangles: measurement.samples[0].triangles,
    }),
  )
  expect(measurement.samples).toHaveLength(90)
  expect(measurement.samples.every((sample) => sample.drawCalls > 0)).toBe(true)
  expect((await snapshot(page)).pointerLocked).toBe(true)

  // Actual capsule collisions, not a camera teleport or an input mock.
  await lookAt(page, { x: -15, y: 1.7, z: 8.15 })
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(1300)
  } finally {
    await page.keyboard.up('w')
  }
  const left = (await snapshot(page)).cameraPosition
  expect(left.x).toBeLessThan(-1.2)
  expect(left.x).toBeGreaterThan(-1.9)
  await lookAt(page, { x: 15, y: 1.7, z: 8.15 })
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(1800)
  } finally {
    await page.keyboard.up('w')
  }
  const right = (await snapshot(page)).cameraPosition
  expect(right.x).toBeGreaterThan(1.2)
  expect(right.x).toBeLessThan(1.9)
  // Pushing into the lower sloped glazing can briefly lift the capsule. Step
  // away with native strafe before asking walkTo to aim at a nearby waypoint.
  await lookAt(page, { x: right.x, y: 1.7, z: -20 })
  await page.keyboard.down('a')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.x, {
        intervals: [30],
        timeout: 5000,
      })
      .toBeLessThan(0.2)
  } finally {
    await page.keyboard.up('a')
  }
  await expect
    .poll(async () => Math.abs((await snapshot(page)).cameraPosition.y - 1.7))
    .toBeLessThan(0.06)
  await walkTo(page, 0, 4.5)
  expect((await snapshot(page)).cameraPosition.z).toBeLessThan(5.1)
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  const resume = page.getByRole('button', { name: 'Resume' })
  if (await resume.isVisible()) await resume.click()
  await enter(page)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
