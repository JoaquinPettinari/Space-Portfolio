import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  walkTo,
  snapshot,
} from './helpers/game'

test('measures sustained frames along the actual arrival, bridge and glass route', async ({
  page,
}, info) => {
  test.setTimeout(240_000)
  const stage =
    process.env.FPS_REVIEW_STAGE === 'before'
      ? 'before'
      : process.env.FPS_REVIEW_STAGE === 'hud'
        ? 'hud'
        : process.env.FPS_REVIEW_STAGE === 'native-final'
          ? 'native-final'
          : 'after'
  const out = `docs/audits/stable-fps/${stage}`
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enter(page)
  const captures: unknown[] = []
  const sampleCount = Number(process.env.FPS_REVIEW_SAMPLES ?? 600)
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    const inventory = await page.evaluate(() =>
      window.__GAME_DEBUG__!.renderInventory(),
    )
    await writeFile(
      `${out}/${name}-draws.json`,
      JSON.stringify(inventory, null, 2),
    )
    const timing = await page.evaluate(async (count) => {
      const frame = () =>
        new Promise<number>((resolve) => requestAnimationFrame(resolve))
      const warmUntil = performance.now() + 6000
      while (performance.now() < warmUntil) await frame()
      const samples = []
      const rafIntervals: number[] = []
      let previous = await frame()
      for (let i = 0; i < count; i++) {
        const timestamp = await frame()
        rafIntervals.push(timestamp - previous)
        previous = timestamp
        samples.push(window.__GAME_DEBUG__!.performance())
      }
      const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
      const mean = times.reduce((a, b) => a + b, 0) / times.length
      const rafTimes = [...rafIntervals].sort((a, b) => a - b)
      const gl = document.querySelector('canvas')!.getContext('webgl2')!
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        viewport: [innerWidth, innerHeight],
        drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        browserDpr: devicePixelRatio,
        renderDprRange: [
          Math.min(...samples.map((s) => s.renderDpr)),
          Math.max(...samples.map((s) => s.renderDpr)),
        ],
        context: gl.getContextAttributes(),
        msaaSamples: gl.getParameter(gl.SAMPLES) as number,
        renderer: ext
          ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
          : 'unknown',
        meanMs: mean,
        rafMeanMs: rafTimes.reduce((a, b) => a + b, 0) / rafTimes.length,
        rafP95Ms: rafTimes[Math.floor(count * 0.95)],
        rafIntervals,
        medianMs: times[Math.floor(count * 0.5)],
        p95Ms: times[Math.floor(count * 0.95)],
        p99Ms: times[Math.floor(count * 0.99)],
        over25Ms: times.filter((t) => t > 25).length / times.length,
        samples,
      }
    }, sampleCount)
    captures.push({ name, ...timing })
    console.log(
      'SUSTAINED_FRAME',
      name,
      JSON.stringify({
        ...timing,
        samples: undefined,
        rafIntervals: undefined,
      }),
    )
    await writeFile(
      `${out}/measurements.json`,
      JSON.stringify({ stage, captures, errors }, null, 2),
    )
    await page.screenshot({ path: `${out}/${name}.png` })
  }
  await capture('arrival', { x: 1, y: 1.9, z: 12 })
  await enterObservationRoom(page)
  await walkTo(page, 0, 0.6)
  await capture('bridge-forward', { x: 0, y: 1.7, z: -12 })
  await capture('bridge-rear', { x: 0, y: 1.7, z: 8 })
  await walkTo(page, 0, 8.15)
  await capture('glass-passage', { x: -15, y: 1.8, z: 8.15 })
  await walkTo(page, 0, 0.6)
  await lookAt(page, { x: 0, y: 1.7, z: 18 })
  const movementSampling = page.evaluate(async () => {
    const samples = []
    const deadline = performance.now() + 16000
    while (performance.now() < deadline) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      samples.push(window.__GAME_DEBUG__!.performance())
    }
    return samples
  })
  // Hold real keys without polling scene raycasts during the timing window.
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(4200)
  } finally {
    await page.keyboard.up('w')
  }
  const arrival = (await snapshot(page)).cameraPosition
  expect(arrival.z).toBeGreaterThan(12)
  expect(arrival.z).toBeLessThan(16)
  await lookAt(page, { x: 0, y: 1.7, z: -12 })
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(4200)
  } finally {
    await page.keyboard.up('w')
  }
  const movement = await movementSampling
  expect((await snapshot(page)).cameraPosition.z).toBeLessThan(2)
  const moving = movement.filter(
    (s, i) =>
      i > 0 &&
      Math.hypot(
        s.cameraPosition.x - movement[i - 1].cameraPosition.x,
        s.cameraPosition.z - movement[i - 1].cameraPosition.z,
      ) > 0.00001,
  )
  expect(moving.length).toBeGreaterThan(100)
  const times = moving.map((s) => s.frameMs).sort((a, b) => a - b)
  const movementSummary = {
    samples: moving.length,
    renderDprRange: [
      Math.min(...moving.map((s) => s.renderDpr)),
      Math.max(...moving.map((s) => s.renderDpr)),
    ],
    meanMs: times.reduce((a, b) => a + b, 0) / times.length,
    medianMs: times[Math.floor(times.length * 0.5)],
    p95Ms: times[Math.floor(times.length * 0.95)],
    p99Ms: times[Math.floor(times.length * 0.99)],
    over25Ms: times.filter((t) => t > 25).length / times.length,
  }
  console.log('MOVING_FRAME', JSON.stringify(movementSummary))
  await writeFile(
    `${out}/movement.json`,
    JSON.stringify({ summary: movementSummary, movement, errors }, null, 2),
  )
  expect(errors).toEqual([])
  await info.attach('sustained-measurements', {
    path: `${out}/measurements.json`,
    contentType: 'application/json',
  })
})
