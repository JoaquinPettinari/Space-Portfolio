import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews the arrival master through native traversal and matched views', async ({
  page,
}, info) => {
  const phase = process.env.CABIN_MASTER_PHASE ?? 'after'
  if (!['before', 'after'].includes(phase)) throw new Error('Invalid phase')
  const out = 'docs/audits/cabin-master-integration'
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  })
  const start = Date.now()
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  const readyMs = Date.now() - start
  await walkTo(page, 0, 15.2)
  await lookAt(page, { x: -4.3, y: 1.5, z: 15.2 })
  await page.screenshot({ path: `${out}/${phase}-window.png` })
  const measure = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 60; i++) await frame()
    const samples = []
    for (let i = 0; i < 180; i++) {
      await frame()
      if (!window.__GAME_DEBUG__) throw new Error('Diagnostics missing')
      samples.push(window.__GAME_DEBUG__.performance())
    }
    const times = samples.map((sample) => sample.frameMs).sort((a, b) => a - b)
    const canvas = document.querySelector('canvas')
    const gl = canvas?.getContext('webgl2')
    if (!canvas || !gl) throw new Error('No WebGL2')
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      userAgent: navigator.userAgent,
      resources: performance
        .getEntriesByType('resource')
        .filter((entry) => new URL(entry.name).pathname.endsWith('.glb'))
        .map((entry) => {
          const resource = entry as PerformanceResourceTiming
          return {
            path: new URL(resource.name).pathname,
            durationMs: resource.duration,
            transferBytes: resource.transferSize,
            encodedBytes: resource.encodedBodySize,
            decodedBytes: resource.decodedBodySize,
          }
        }),
      renderer: extension
        ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
        : 'unknown',
      viewport: [innerWidth, innerHeight],
      canvas: [canvas.width, canvas.height],
      medianMs: times[90],
      p95Ms: times[171],
      samples,
    }
  })
  await lookAt(page, { x: 0, y: 1.55, z: 18.3 })
  await page.screenshot({ path: `${out}/${phase}-docking.png` })
  await lookAt(page, { x: 4.1, y: 1.4, z: 15.2 })
  await page.screenshot({ path: `${out}/${phase}-service.png` })
  const baseline = { readyMs, ...measure, errors, warnings }
  await writeFile(
    `${out}/${phase}.json`,
    JSON.stringify(baseline, null, 2) + '\n',
  )
  console.log(
    'CABIN_MASTER',
    phase,
    JSON.stringify({
      readyMs,
      medianMs: measure.medianMs,
      p95Ms: measure.p95Ms,
      sample: measure.samples[90],
    }),
  )
  if (phase === 'after') {
    await walkTo(page, 0, 17.1)
    await lookAt(page, { x: 0, y: 1.58, z: 20.9 })
    await page.screenshot({ path: `${out}/after-visor.png` })
    // Traverse the cleared former lounge floor, then test the actual ledge collider.
    await walkTo(page, 0, 15.2)
    await walkTo(page, -3.25, 15.2)
    await lookAt(page, {
      x: -6,
      y: (await snapshot(page)).cameraPosition.y,
      z: 15.2,
    })
    await page.keyboard.down('w')
    try {
      await page.waitForTimeout(1200)
    } finally {
      await page.keyboard.up('w')
    }
    const ledge = (await snapshot(page)).cameraPosition
    expect(ledge.x).toBeGreaterThan(-3.95)
    expect(ledge.x).toBeLessThan(-3.35)
    await walkTo(page, 0, 15.2)
    await enterObservationRoom(page)
    expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
    await page.screenshot({ path: `${out}/after-bridge.png` })
    await walkTo(page, 0, 13.4)
    expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(12)
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('dialog', { name: 'Game paused' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Resume mission' }).click()
    await expect
      .poll(async () => (await snapshot(page)).pointerLocked)
      .toBe(true)
  }
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
  await info.attach('cabin-master-observations', {
    body: JSON.stringify(baseline),
    contentType: 'application/json',
  })
})
