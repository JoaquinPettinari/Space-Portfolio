import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom, lookAt } from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ video: 'on' })
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
test('tablet objective completes and table projects the crew record from a distance', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await expect(
    page.getByRole('button', { name: 'Ambient sound' }),
  ).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('t')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(
    tablet.getByRole('button', { name: /Open mission tablet/ }),
  ).toHaveAttribute('data-complete', 'true')
  await expect(tablet).toContainText('1 / 6 objectives complete')
  await tablet.getByRole('button', { name: /Activate crew hologram/ }).hover()
  await expect(tablet.locator('.map-objective')).toContainText(
    'Central projection table',
  )
  await page.getByRole('button', { name: 'Close tablet' }).click()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 6 complete')
  await enterObservationRoom(page)
  await lookAt(page, { x: 2.15, y: 1.05, z: 0 })
  await expect(
    page.getByText('E · Activate crew hologram', { exact: true }),
  ).toBeVisible()
  const standing = await snapshot(page)
  await page.keyboard.press('e')
  await expect(
    page.getByRole('dialog', { name: 'Crew identification', exact: true }),
  ).toBeVisible()
  const hologram = page.getByRole('dialog', { name: 'Joaquín Pettinari' })
  await expect(hologram).toBeVisible()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toContainText(
    'Identity verified. Welcome aboard, Engineer. Your personnel record is available.',
  )
  expect((await snapshot(page)).pointerLocked).toBe(false)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(2.8, 1)
  await page.mouse.click(640, 320)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await page.screenshot({ path: 'artifacts/crew-hologram.png' })
  await hologram.getByRole('button', { name: 'Training record' }).click()
  await expect(hologram.getByRole('heading', { name: /Master/ })).toBeVisible()
  await hologram.getByRole('button', { name: 'Leave hologram' }).click()
  await expect(hologram).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('3 / 6 complete')
})
