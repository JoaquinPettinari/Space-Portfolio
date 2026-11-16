import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  approach,
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews the cleared arrival, imported niches and centred tactical layout', async ({
  page,
}) => {
  test.setTimeout(240000)
  const out = 'docs/audits/arrival-layout'
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  await walkTo(page, 0, 15)
  await lookAt(page, { x: -0.5, y: 1.5, z: 18.23 })
  await page.screenshot({ path: out + '/arrival.png' })
  await lookAt(page, { x: 4, y: 1.5, z: 15.6 })
  await page.screenshot({ path: out + '/service-wall.png' })
  await lookAt(page, { x: -4.3, y: 0.85, z: 16.2 })
  await page.screenshot({ path: out + '/bench.png' })
  await enterObservationRoom(page)
  await walkTo(page, 0, 6.3)
  await lookAt(page, { x: 0, y: 1.7, z: 0 })
  await page.screenshot({ path: out + '/passage.png' })
  await walkTo(page, 0, 0.05)
  for (const side of [-1, 1]) {
    await walkTo(page, side * 2.4, 0.05)
    await lookAt(page, { x: side * 2.8, y: 1.6, z: 1.4 })
    await page.screenshot({
      path: out + (side < 0 ? '/specimen.png' : '/technical.png'),
    })
  }
  await walkTo(page, 0, -0.2)
  await approach(page, { x: 0, y: 1.04, z: -1.5 }, 'E Tactical Table')
  await page.keyboard.press('e')
  const table = page.getByRole('dialog', {
    name: 'Tactical Table',
    exact: true,
  })
  await expect(table).toBeVisible()
  await page.screenshot({ path: out + '/tactical.png' })
  await table.getByRole('slider', { name: 'Zoom' }).fill('1')
  for (let i = 0; i < 3; i++)
    await table
      .getByRole('button', { name: 'Rotate right', exact: true })
      .click()
  await expect(table.getByRole('slider')).toHaveValue('1')
  await page.screenshot({ path: out + '/tactical-zoom.png' })
  await table.getByRole('button', { name: 'Systems', exact: true }).click()
  await expect(table.getByText('Online', { exact: true })).toBeVisible()
  await table.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await walkTo(page, 2.4, 0.05)
  await lookAt(page, { x: 0, y: 1.65, z: -2.65 })
  const cost = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((r) => requestAnimationFrame(() => r()))
    for (let i = 0; i < 30; i++) await frame()
    const samples = []
    for (let i = 0; i < 120; i++) {
      await frame()
      samples.push(window.__GAME_DEBUG__!.performance())
    }
    const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
    return {
      samples,
      medianMs: times[60],
      p95Ms: times[114],
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
    }
  })
  console.log('ARRIVAL_LAYOUT_COST', cost.medianMs, cost.p95Ms)
  await writeFile(out + '/timing.json', JSON.stringify(cost, null, 2))
  expect(errors).toEqual([])
})
