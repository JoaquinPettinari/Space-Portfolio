import { expect, test, type Page } from '@playwright/test'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

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
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas not ready')
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expectLocked(page, true)
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

test('tablet T and exit actions resume real mouse capture without another click or held-key drift', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.keyboard.down('w')
  await page.keyboard.press('t')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  await expectLocked(page, false)
  const stopped = (await snapshot(page)).cameraPosition
  await page.keyboard.press('t')
  await expect(tablet).not.toBeVisible()
  await expectLocked(page, true)
  await page.waitForTimeout(200)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(stopped.z, 2)
  await page.keyboard.up('w')

  for (const action of [
    'Close tablet',
    'Continue Protocol',
    'Skip Tutorial',
    'Resume Protocol',
    'Replay Protocol',
  ]) {
    await page.keyboard.press('t')
    await expect(tablet).toBeVisible()
    await expectLocked(page, false)
    await tablet.getByRole('button', { name: action, exact: true }).click()
    await expect(tablet).not.toBeVisible()
    await expectLocked(page, true)
    await expect(
      page.getByRole('button', { name: 'Click to control the mouse' }),
    ).not.toBeVisible()
  }
  await page.keyboard.press('Escape')
  await expectLocked(page, false)
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeVisible()
})

test('computer E and exit button return directly to walking while Escape leaves the cursor free', async ({
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
  await expectLocked(page, false)
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeVisible()
})

test('hologram E closes the interaction and recaptures the real mouse', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.mouse.move(640, 360)
  await page.mouse.move(915, 435, { steps: 12 })
  await expect(
    page.getByText('E · Activate crew hologram', { exact: true }),
  ).toBeVisible()
  const standing = (await snapshot(page)).cameraPosition
  await page.keyboard.press('e')
  const hologram = page.getByRole('dialog', { name: 'Joaquín Pettinari' })
  await expect(hologram).toBeVisible()
  await expectLocked(page, false)
  await page.keyboard.press('e')
  await expect(hologram).not.toBeVisible()
  await expectLocked(page, true)
  await expect(
    page.getByText('E · Activate crew hologram', { exact: true }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(standing.x, 1)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(standing.z, 1)
})
