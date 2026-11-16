import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews the tactical ship, planetary composition and development capture handoff', async ({
  page,
}, info) => {
  test.setTimeout(240000)
  const stage =
    process.env.TACTICAL_REVIEW_STAGE === 'before' ? 'before' : 'after'
  const out = 'docs/audits/tactical-vista/' + stage
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enterObservationRoom(page)
  await walkTo(page, 2.4, 0.05)
  await lookAt(page, { x: 0, y: 1.65, z: -2.65 })
  const timing = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 60; i++) await frame()
    const samples = []
    for (let i = 0; i < 180; i++) {
      await frame()
      samples.push(window.__GAME_DEBUG__!.performance())
    }
    const sorted = samples.map((s) => s.frameMs).sort((a, b) => a - b)
    return {
      samples,
      medianMs: sorted[90],
      p95Ms: sorted[171],
      meanMs: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      viewport: [innerWidth, innerHeight],
      browserDpr: devicePixelRatio,
    }
  })
  await writeFile(out + '/timing.json', JSON.stringify(timing, null, 2))
  console.log(
    'TACTICAL_VISTA',
    JSON.stringify({ ...timing, samples: timing.samples.length }),
  )
  await page.screenshot({ path: out + '/table.png' })
  await lookAt(page, { x: 38, y: 8, z: -58 })
  await page.screenshot({ path: out + '/ringed-planet.png' })
  await lookAt(page, { x: -26, y: -7, z: -62 })
  await page.screenshot({ path: out + '/earth.png' })
  if (stage === 'before') {
    expect(errors).toEqual([])
    return
  }
  const heading = (await snapshot(page)).tacticalModelHeading
  expect(heading).not.toBeNull()
  await page.waitForTimeout(200)
  expect((await snapshot(page)).tacticalModelHeading).toBe(heading)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect
    .poll(async () => (await snapshot(page)).tacticalModelHeading)
    .not.toBe(heading)

  await lookAt(page, { x: 0, y: 1.65, z: -2.65 })
  // Native tab focus handoff: do not simulate blur or Pointer Lock.
  await page.keyboard.down('w')
  await page.waitForTimeout(100)
  const other = await page.context().newPage()
  await other.goto('about:blank')
  await other.bringToFront()
  await other.waitForTimeout(150)
  await page.bringToFront()
  await other.close()
  await page.keyboard.up('w')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  const capture = (await snapshot(page)).developmentCapture
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  if (capture) await expect(pause).not.toBeVisible()
  else await expect(pause).toBeVisible()
  await page.waitForTimeout(250)
  const stop = (await snapshot(page)).cameraPosition
  await page.waitForTimeout(300)
  const rest = (await snapshot(page)).cameraPosition
  expect(Math.hypot(rest.x - stop.x, rest.z - stop.z)).toBeLessThan(0.02)
  await page.screenshot({ path: out + '/focus-return.png' })
  await enter(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible()
  expect(errors).toEqual([])
  await info.attach('tactical-vista-timing', {
    body: JSON.stringify(timing),
    contentType: 'application/json',
  })
})
