import { expect, test, type Page } from '@playwright/test'
import {
  approach,
  forwardStation,
  enter,
  enterObservationRoom,
  lookAt,
  protocol,
  snapshot,
} from './helpers/game'

const browserErrors = new WeakMap<Page, string[]>()
const expectedContactFailure = new WeakSet<Page>()
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (
      expectedContactFailure.has(page) &&
      message.location().url.endsWith('/api/contact') &&
      message.text() ===
        'Failed to load resource: the server responded with a status of 503 (Service Unavailable)'
    ) {
      expectedContactFailure.delete(page)
      return
    }
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 60000 })
})
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([])
})

test('Crew Access scans once into a compact physical identity and persists real crew progress', async ({
  page,
}) => {
  await enter(page)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.73)
  await page.keyboard.down('s')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeGreaterThan(7.55)
  } finally {
    await page.keyboard.up('s')
  }
  await lookAt(page, { x: -1.4, y: 1.65, z: 7.3 })
  await expect(
    page.getByText('E · Crew Access', { exact: true }),
    JSON.stringify(await snapshot(page)),
  ).toBeVisible()
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Crew Access' })
  await expect(dialog.getByRole('status')).toContainText('ACCESS GRANTED')
  await expect(
    dialog.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: /Master’s Degree/ }),
  ).toBeVisible()
  expect(await dialog.locator('img').count()).toBe(0)
  const pane = dialog.locator('.portfolio-content')
  expect(
    await pane.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true)
  expect((await protocol(page)).completed).toContain('crew')
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 60000 })
  expect((await protocol(page)).completed).toContain('crew')
})

test('cancelled Crew Access does not authenticate and the table no longer authenticates', async ({
  page,
}) => {
  await enter(page)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.73)
  await page.keyboard.down('s')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeGreaterThan(7.55)
  } finally {
    await page.keyboard.up('s')
  }
  await lookAt(page, { x: -1.4, y: 1.65, z: 7.3 })
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  await page.keyboard.press('e')
  await expect(page.getByText('Reading crew card…')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('dialog', { name: 'Crew Access' }),
  ).not.toBeVisible()
  await page.waitForTimeout(1400)
  expect((await protocol(page)).completed ?? []).not.toContain('crew')
  await enterObservationRoom(page)
  await lookAt(page, { x: 0, y: 1.05, z: 0.5 })
  await page.keyboard.press('e')
  expect((await protocol(page)).completed ?? []).not.toContain('crew')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('physical Communications preserves Skip, validation and accepted retry', async ({
  page,
}) => {
  let sends = 0
  await page.route('**/api/contact', async (route) => {
    sends++
    if (sends === 1) expectedContactFailure.add(page)
    await route.fulfill(
      sends === 1
        ? { status: 503, json: { error: 'Unavailable' } }
        : { status: 200, json: { accepted: true } },
    )
  })
  await enterObservationRoom(page)
  await forwardStation(page, 1)
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Earth Communications' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveClass(/physical/)
  const form = dialog.getByRole('form')
  await expect(form).toContainText('Norwegian')
  await form.getByRole('button', { name: 'Skip', exact: true }).click()
  expect(sends).toBe(0)
  await form
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Test Visitor')
  await form
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('visitor@example.com')
  await form
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('A test only.')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('alert')).toContainText('not confirmed')
  await expect(
    form.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveValue('A test only.')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('status')).toContainText('accepted')
  expect(sends).toBe(2)
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
})

test('physical Personal Workstation supports keyboard apps and the real CV', async ({
  page,
}) => {
  await enterObservationRoom(page)
  await approach(page, { x: 4.55, y: 1.65, z: 2.1 }, 'E · Personal Workstation')
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Personal Workstation' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveClass(/physical/)
  await dialog
    .getByRole('button', { name: 'Crew Dossier.pdf', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  const download = page.waitForEvent('download')
  await dialog.getByRole('link', { name: /Download CV/ }).click()
  expect(await (await download).failure()).toBeNull()
  await page.keyboard.press('Escape')
  await dialog
    .getByRole('button', { name: 'Command Terminal', exact: true })
    .click()
  await expect(dialog.getByRole('textbox')).toBeVisible()
  await page.keyboard.press('Escape')
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
})

test('held tablet keeps movement and real mouse capture, focus pauses and Skip resumes', async ({
  page,
}) => {
  await enterObservationRoom(page)
  await page.keyboard.press('t')
  const held = page.getByRole('region', { name: 'Held mission tablet' })
  await expect(held).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(true)
  const before = (await snapshot(page)).cameraPosition.z
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(before - 0.4)
  await page.keyboard.press('r')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  await page.waitForTimeout(150)
  const stopped = (await snapshot(page)).cameraPosition.z
  await page.waitForTimeout(250)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(stopped, 3)
  await page.keyboard.up('w')
  await tablet
    .getByRole('button', { name: 'Skip Tutorial', exact: true })
    .click()
  await expect(held).toBeVisible()
  await expect(held).toContainText('Guidance paused')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await page.keyboard.press('t')
  await expect(held).not.toBeVisible()
  await page.keyboard.press('Escape')
  expect((await snapshot(page)).pointerLocked).toBe(false)
})
