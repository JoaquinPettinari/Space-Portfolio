import { expect, test, type Page } from '@playwright/test'
import {
  approach,
  walkTo,
  enterObservationRoom,
  protocol,
  snapshot,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

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
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await enterObservationRoom(page)
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  await page.getByRole('button', { name: 'Skip Tutorial', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect((await protocol(page)).guidance).toBe('skipped')
  await page.keyboard.press('t')
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('coffee and image inspection remain available with guidance skipped', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const before = await protocol(page)
  await walkTo(page, -2.4, 3.1)
  await approach(page, { x: -4.25, y: 1.2, z: 3.65 }, 'E · Brew coffee')
  await page.keyboard.press('e')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(
    page.getByText('E · Drink coffee', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('cruz-del-sur.coffee')),
    )
    .toBe('1')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(await protocol(page)).toEqual(before)
  await approach(
    page,
    { x: -4.78, y: 1.75, z: 2.2 },
    'E · Inspect project photo',
  )
  await page.keyboard.press('e')
  const photo = page.getByRole('dialog', { name: 'Project photo', exact: true })
  await expect(photo).toBeVisible()
  await expect(
    photo.getByRole('img', {
      name: 'RouteWise landing page with a coastal destination',
    }),
  ).toBeVisible()
  await photo.getByRole('button', { name: 'Zoom in' }).click()
  await expect(photo.getByRole('status')).toHaveText('Magnification: 2×')
  await photo.getByRole('button', { name: 'Fit image' }).click()
  await expect(photo.getByRole('status')).toHaveText('Magnification: 1×')
  await page.keyboard.press('Escape')
  await expect(photo).not.toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  expect(await protocol(page)).toEqual(before)
})

test('fictional command input preserves E and T and brews through the shared dispenser', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const before = await protocol(page)
  await walkTo(page, 3.2, 3.1)
  await approach(page, { x: 4.55, y: 1.65, z: 2.1 }, 'E · Personal Workstation')
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
    page.getByText('E · Personal Workstation', { exact: true }),
  ).toBeVisible()
  await approach(page, { x: -4.25, y: 1.2, z: 3.65 }, 'E · Drink coffee')
  await page.keyboard.press('e')
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('cruz-del-sur.coffee')),
    )
    .toBe('1')
  expect(await protocol(page)).toEqual(before)
})
