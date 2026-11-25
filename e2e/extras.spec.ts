import { BRIDGE_OFFSET_Z } from '../src/game/world/bridgePlacement'
import { COFFEE_POSITION } from '../src/game/interaction/station'
import { expect, test, type Page } from '@playwright/test'
import {
  approach,
  walkTo,
  enterObservationRoom,
  protocol,
  snapshot,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

const [coffeeX, coffeeY, coffeeZ] = COFFEE_POSITION

const errors = new WeakMap<Page, string[]>()
// Include the real power/airlock walkthrough in the hook's time budget.
test.setTimeout(120_000)
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
  await enterObservationRoom(page)
  await page.keyboard.press('t')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect((await protocol(page)).guidance).toBe('pending')
  await page.keyboard.press('t')
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('coffee remains available without opening a mission menu', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const before = await protocol(page)
  await walkTo(page, 3.0, 0.35)
  await approach(
    page,
    { x: coffeeX, y: coffeeY, z: coffeeZ },
    'E · Brew coffee',
  )
  await page.keyboard.press('e')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Drink coffee' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await snapshot(page)).session.coffee.achievement)
    .toBe(true)
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(await protocol(page)).toEqual(before)
})

test('fictional command input preserves E and T and brews through the shared dispenser', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const before = await protocol(page)
  await walkTo(page, 3.2, 3.1 + BRIDGE_OFFSET_Z)
  await approach(
    page,
    { x: 4.55, y: 1.65, z: 2.1 + BRIDGE_OFFSET_Z },
    'E · Personal Workstation',
  )
  await page.keyboard.press('e')
  const desktop = page.getByRole('dialog', {
    name: 'Personal Workstation',
    exact: true,
  })
  await desktop
    .getByRole('button', { name: 'Command Terminal', exact: true })
    .click()
  const command = desktop.getByRole('textbox', { name: 'Command', exact: true })
  await command.focus()
  await page.keyboard.press('e')
  await page.keyboard.press('t')
  await expect(command).toHaveValue('et')
  await expect(desktop).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(
    desktop.getByRole('log', { name: 'Command output' }),
  ).toContainText('Unknown command')
  await command.fill('npm install coffee')
  await page.keyboard.press('Enter')
  await expect(
    desktop.getByRole('log', { name: 'Command output' }),
  ).toContainText('No software was installed')
  await expect(command).toBeInViewport()
  expect(await protocol(page)).toEqual(before)
  await page.keyboard.press('Escape')
  await expect(desktop).toBeVisible()
  await page.keyboard.press('e')
  await expect(desktop).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  // Capture resumes before the camera's return transition has finished.
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: 'Personal Workstation' }),
  ).toBeVisible()
  await walkTo(page, 3.0, 0.35)
  await approach(
    page,
    { x: coffeeX, y: coffeeY, z: coffeeZ },
    'E · Drink coffee',
  )
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await snapshot(page)).session.coffee.achievement)
    .toBe(true)
  expect(await protocol(page)).toEqual(before)
})
