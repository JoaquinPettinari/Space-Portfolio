import { writeFile, mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('keeps the sky fixed while independent scenery respects reduced motion', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enter(page)
  const before = (await snapshot(page)).spaceMotion
  expect(before.worlds).not.toBeNull()
  expect(before.shuttle).not.toBeNull()
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.shuttle)
    .not.toBe(before.shuttle)
  expect(before.debris).not.toBeNull()
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.worlds)
    .not.toEqual(before.worlds)
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.debris)
    .not.toEqual(before.debris)
  expect((await snapshot(page)).spaceMotion.orbit).toBe(before.orbit)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(200)
  const still = (await snapshot(page)).spaceMotion
  await page.waitForTimeout(300)
  expect((await snapshot(page)).spaceMotion).toEqual(still)
  expect(errors).toEqual([])
})

test('reviews imported interior art, circulation and render cost through native gameplay', async ({
  page,
}) => {
  const stage =
    process.env.INTERIOR_REVIEW_STAGE === 'before' ? 'before' : 'after'
  const directory = `docs/audits/refined-runtime/${stage}`
  await mkdir(directory, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enter(page)
  const measurements: {
    name: string
    medianMs: number
    p95Ms: number
    drawCalls: number
    triangles: number
  }[] = []
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    const measurement = await page.evaluate(async () => {
      const frame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      for (let i = 0; i < 10; i++) await frame()
      const samples = []
      for (let i = 0; i < 40; i++) {
        await frame()
        samples.push(window.__GAME_DEBUG__!.performance())
      }
      const state = window.__GAME_DEBUG__!.snapshot()
      const times = samples
        .map((sample) => sample.frameMs)
        .sort((a, b) => a - b)
      const gl = document.querySelector('canvas')?.getContext('webgl2')
      const extension = gl?.getExtension('WEBGL_debug_renderer_info')
      return {
        position: state.cameraPosition,
        rotation: state.cameraRotation,
        resources: state.resources,
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        renderer:
          gl && extension
            ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
            : 'unknown',
        medianMs: times[20],
        p95Ms: times[38],
        drawCalls: samples[20].drawCalls,
        triangles: samples[20].triangles,
        samples,
      }
    })
    measurements.push({ name, ...measurement })
    await writeFile(
      `${directory}/measurements.json`,
      JSON.stringify({ measurements, errors }, null, 2),
    )
    await page.screenshot({ path: `${directory}/${name}.png` })
  }
  await enterObservationRoom(page)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await walkTo(page, 0, 0.6)
  await capture('bridge-forward', { x: 0, y: 1.7, z: -12 })
  await capture('bridge-rear', { x: 0, y: 1.7, z: 8 })
  await walkTo(page, 2.2, -1.4)
  await lookAt(page, { x: 4.05, y: 1.4, z: -0.38 })
  await page.screenshot({ path: `${directory}/console-and-plants.png` })
  await walkTo(page, 0, 0.6)
  await walkTo(page, 0, 8.15)
  await capture('glass-passage', { x: -15, y: 1.8, z: 8.15 })
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  await page
    .getByRole('button', { name: 'Resume mission', exact: true })
    .click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await walkTo(page, 0, 15.8)
  await capture('arrival', { x: 1, y: 1.9, z: 12 })
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.85)
  if (stage === 'after') {
    const loaded = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((r) => r.name),
    )
    for (const asset of [
      'cruz-del-sur-refined-bridge.glb',
      'cruz-del-sur-refined-arrival.glb',
      'cruz-del-sur-refined-details.glb',
    ])
      expect(loaded.some((url) => url.includes(asset))).toBe(true)
  }
  expect(errors).toEqual([])
  await writeFile(
    `${directory}/measurements.json`,
    JSON.stringify({ measurements, errors }, null, 2),
  )
})
