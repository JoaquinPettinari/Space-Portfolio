import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom, approachCrew } from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
const errors = new WeakMap<Page, string[]>()
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
  const collected = errors.get(page) ?? []
  await info.attach('browser-errors', {
    body: JSON.stringify(collected),
    contentType: 'application/json',
  })
  expect(collected).toEqual([])
})
async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}
test('tablet locates Crew Access and one scan reveals the compact identity record', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  await page.keyboard.press('r')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(
    tablet.getByRole('button', { name: /Open mission tablet/ }),
  ).toHaveAttribute('data-complete', 'true')
  await expect(tablet).toContainText('1 / 6 objectives complete')
  await tablet.getByRole('button', { name: /Verify crew identity/ }).hover()
  await expect(tablet.locator('.map-objective')).toContainText('Crew Access')
  await tablet.getByRole('button', { name: 'Close tablet' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await approachCrew(page)
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  const standing = await snapshot(page)
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(identity).toBeVisible()
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expect(
    identity.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await expect(identity.getByRole('heading', { name: /Master/ })).toBeVisible()
  await expect(identity.locator('img')).toHaveCount(0)
  await expect(
    identity.getByRole('button', { name: 'Training record' }),
  ).toHaveCount(0)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await identity.getByRole('button', { name: 'Leave terminal' }).click()
  await expect(identity).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  await enterObservationRoom(page)
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('3 / 6 complete')
})
