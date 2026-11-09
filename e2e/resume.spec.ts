import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom, approachCrew } from './helpers/game'
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
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
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

test('tablet focus and exit actions resume real mouse capture without another click or held-key drift', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.keyboard.down('w')
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  await expectLocked(page, true)
  await page.keyboard.press('r')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  await expectLocked(page, false)
  const stopped = (await snapshot(page)).cameraPosition
  await page.keyboard.press('t')
  await expect(tablet).not.toBeVisible()
  await expectLocked(page, true)
  await page.waitForTimeout(200)
  // Rapier finishes interpolating the last pre-pause step on resume.
  const settled = (await snapshot(page)).cameraPosition.z
  expect(Math.abs(settled - stopped.z)).toBeLessThan(0.08)
  await page.waitForTimeout(350)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(settled, 3)
  await page.keyboard.up('w')

  for (const action of [
    'Close tablet',
    'Continue Protocol',
    'Skip Tutorial',
    'Resume Protocol',
    'Replay Protocol',
  ]) {
    await page.keyboard.press('t')
    await page.keyboard.press('r')
    await expect(tablet).toBeVisible()
    await expectLocked(page, false)
    await tablet.getByRole('button', { name: action, exact: true }).click()
    await expect(tablet).not.toBeVisible()
    await expectLocked(page, true)
    await expect(
      page.getByRole('button', { name: 'Resume mission' }),
    ).not.toBeVisible()
    if (action !== 'Close tablet') {
      await expect(
        page.getByRole('region', { name: 'Held mission tablet' }),
      ).toBeVisible()
      await page.keyboard.press('t')
    }
  }
  await page.keyboard.press('Escape')
  await expectLocked(page, false)
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).toBeVisible()
})

test('computer E, exit button and Escape return without opening pause', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.keyboard.down('w')
  await expect(
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()
  await page.keyboard.up('w')
  const standing = (await snapshot(page)).cameraPosition
  const archive = page.getByRole('dialog', { name: 'Central Archive' })

  await page.keyboard.press('e')
  await expect(archive).toBeVisible()
  await expectLocked(page, false)
  await page.keyboard.press('e')
  await expect(archive).not.toBeVisible()
  await expectLocked(page, true)
  await expect(
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(standing.z, 1)

  await page.keyboard.press('e')
  await expect(archive).toBeVisible()
  await archive.getByRole('button', { name: 'Exit computer' }).click()
  await expectLocked(page, true)
  await expect(
    page.getByText('E · Use computer', { exact: true }),
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
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
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
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(standing.x, 1)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(standing.z, 1)
})
