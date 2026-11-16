import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews clear passage glazing, recessed grilles, grounded shelves and realistic orbital scenery', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const out = 'docs/audits/interior-orbit-polish/after'
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enter(page)
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    await page.screenshot({ path: `${out}/${name}.png` })
  }
  await capture('single-docking-label', { x: 0, y: 2.1, z: 18.265 })
  await enterObservationRoom(page)
  await walkTo(page, 0, 0.4)
  await capture('earth-and-moon', { x: -18, y: 1, z: -62 })
  await capture('distant-jupiter', { x: 73, y: 12, z: -29 })
  await capture('detailed-recesses', { x: 4.08, y: 1.5, z: 1.66 })
  await walkTo(page, 2.1, 0.3)
  await capture('supported-books', { x: 4.15, y: 1.23, z: 0.55 })
  await capture('expedition-board-shelf', { x: 2.86, y: 1.2, z: 1.52 })
  await walkTo(page, 0, 0.4)
  await capture('deep-floor-grilles', { x: 1.75, y: -0.13, z: 2.33 })
  await walkTo(page, -2.7, 0.6)
  await lookAt(page, { x: -4.58, y: 1.75, z: 1.15 })
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: 'Inspect project photo' }),
  ).toHaveCount(0)
  await page.keyboard.press('e')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await expect(
    page.getByRole('dialog', { name: 'Project photo', exact: true }),
  ).toHaveCount(0)
  await walkTo(page, 0, 0.4)
  await walkTo(page, 0, 8.15)
  await capture('clear-side-glass', { x: -15, y: 1.8, z: 8.15 })
  await walkTo(page, 0, 5.5)
  await capture('contained-bridge-exterior', { x: 3.3, y: 1.5, z: 1.95 })
  await walkTo(page, 0, 3.6)
  await capture('corridor-recess-shelves', { x: 1.72, y: 1.7, z: 3.6 })
  await capture('port-corridor-recess', { x: -1.72, y: 1.7, z: 3.6 })
  await walkTo(page, 0, 8.15)
  await lookAt(page, { x: -15, y: 1.8, z: 8.15 })
  const samples = await page.evaluate(async () => {
    const frames = []
    for (let i = 0; i < 60; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      frames.push(window.__GAME_DEBUG__!.performance())
    }
    return frames
  })
  const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
  await writeFile(
    `${out}/performance.json`,
    JSON.stringify(
      {
        viewport: [1280, 720],
        dpr: 1,
        medianMs: times[30],
        p95Ms: times[57],
        samples,
        errors,
      },
      null,
      2,
    ),
  )
  expect(errors).toEqual([])
})
