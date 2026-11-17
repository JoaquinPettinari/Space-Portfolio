import { expect, test, type Page } from '@playwright/test'
import {
  enterObservationRoom,
  approachCrew,
  forwardStation,
} from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

const errors = new WeakMap<Page, string[]>()
async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}
async function expectLocked(page: Page, locked: boolean) {
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(locked)
}
async function enter(page: Page) {
  await enterObservationRoom(page)
}

test.beforeEach(async ({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 45_000,
  })
  await expect
    .poll(() => page.evaluate(() => !!window.__GAME_DEBUG__))
    .toBe(true)
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('tablet toggle and R retain real mouse capture; lowering and pausing leave no held-key drift', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  const tablet = page.getByRole('region', { name: 'Held mission tablet' })
  await page.keyboard.press('t')
  await expect(tablet).toBeVisible()
  await expectLocked(page, true)
  await page.keyboard.press('r')
  await expect(tablet).toBeVisible()
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toHaveCount(0)
  await expectLocked(page, true)
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.keyboard.press('t')
    await expect(tablet).not.toBeVisible()
    await expectLocked(page, true)
    await page.keyboard.press('t')
    await expect(tablet).toBeVisible()
    await expectLocked(page, true)
  }
  await page.keyboard.press('Escape')
  await expect(tablet).not.toBeVisible()
  await expectLocked(page, true)
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).not.toBeVisible()
  await page.keyboard.press('Escape')
  await expectLocked(page, false)
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).toBeVisible()
  const stopped = (await snapshot(page)).cameraPosition
  await page.keyboard.press('w')
  await page.waitForTimeout(200)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(stopped.z, 2)
})

test('computer E, exit button and Escape return without opening pause', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await forwardStation(page, -1)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()
  const standing = (await snapshot(page)).cameraPosition
  const archive = page.getByRole('dialog', { name: 'Central Archive' })

  await page.keyboard.press('e')
  await expect(archive).toBeVisible()
  await expectLocked(page, false)
  await page.keyboard.press('e')
  await expect(archive).not.toBeVisible()
  await expectLocked(page, true)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(standing.z, 1)

  await page.keyboard.press('e')
  await expect(archive).toBeVisible()
  await archive.getByRole('button', { name: 'Exit computer' }).click()
  await expectLocked(page, true)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(archive).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(archive).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).not.toBeVisible()
})

test('Crew Access E closes the interaction and recaptures the real mouse', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await approachCrew(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
  const standing = (await snapshot(page)).cameraPosition
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expectLocked(page, false)
  await page.keyboard.press('e')
  await expect(identity).not.toBeVisible()
  await expectLocked(page, true)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(standing.x, 1)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(standing.z, 1)
})
