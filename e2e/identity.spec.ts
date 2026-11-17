import { expect, test, type Page } from '@playwright/test'
import {
  enterObservationRoom,
  approachCrew,
  lookAt,
  walkTo,
} from './helpers/game'
import {
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_DEPTH,
} from '../src/game/world/arrivalRoomLayout'
import { EVA_EQUIPMENT_LAYOUT } from '../src/game/world/evaEquipmentLayout'
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
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 45_000,
  })
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
}, info) => {
  test.setTimeout(120_000)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  const tablet = page.getByRole('region', { name: 'Held mission tablet' })
  await expect(
    tablet.getByRole('listitem').filter({ hasText: 'Verify crew identity' }),
  ).toHaveAttribute('data-complete', 'false')
  await expect(tablet).toContainText('0 / 4')
  await expect(
    tablet.getByRole('img', {
      name: /Crew Access in the docking arrival room/,
    }),
  ).toBeVisible()
  await page.keyboard.press('t')
  await expect(tablet).not.toBeVisible()
  await approachCrew(page)
  await expect(page.locator('.interaction-hint')).toContainText('Crew Access')
  const standing = await snapshot(page)
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(identity).toBeVisible()
  const panel = identity.locator('.crew-identity')
  const status = panel.getByRole('status')
  await expect(status).toContainText('Verifying credentials')
  const scanningBounds = await panel.boundingBox()
  const scanningStatus = await status.boundingBox()
  const started = Date.now()
  await expect(status).toContainText('ACCESS GRANTED', { timeout: 3000 })
  expect(Date.now() - started).toBeLessThan(3000)
  const grantedBounds = await panel.boundingBox()
  const grantedStatus = await status.boundingBox()
  expect(scanningBounds).not.toBeNull()
  expect(scanningStatus).not.toBeNull()
  expect(grantedBounds).not.toBeNull()
  expect(grantedStatus).not.toBeNull()
  for (const dimension of ['x', 'y', 'width', 'height'] as const) {
    expect(
      Math.abs(scanningBounds![dimension] - grantedBounds![dimension]),
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(scanningStatus![dimension] - grantedStatus![dimension]),
    ).toBeLessThanOrEqual(1)
  }
  await page.screenshot({ path: info.outputPath('crew-access-granted.png') })
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expect(
    identity.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await expect(identity.getByRole('heading', { name: /Master/ })).toBeVisible()
  const portrait = identity.getByRole('img', { name: 'Joaquín Pettinari' })
  await expect(portrait).toHaveCount(1)
  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveAttribute('src', '/images/crew-portrait.webp')
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
  await walkTo(page, -0.8, 16)
  await lookAt(page, {
    x: EVA_EQUIPMENT_LAYOUT.position[0],
    y: 1.75,
    z:
      ARRIVAL_ORIGIN_Z +
      ARRIVAL_DEPTH -
      0.04 +
      EVA_EQUIPMENT_LAYOUT.position[2],
  })
  await page.screenshot({ path: info.outputPath('hanging-suit.png') })
  await enterObservationRoom(page)
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 4 complete')
})
