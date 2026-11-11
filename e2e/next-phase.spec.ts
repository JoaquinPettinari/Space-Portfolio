import { expect, test, type Page } from '@playwright/test'
import {
  approach,
  approachCrew,
  forwardStation,
  enter,
  enterObservationRoom,
  lookAt,
  protocol,
  snapshot,
  walkTo,
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
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toBeVisible({ timeout: 60000 })
  expect((await snapshot(page)).powerSwitchCount).toBe(0)
})
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([])
})

test('arrival power is online without a switch interaction', async ({
  page,
}) => {
  await enter(page)
  expect((await protocol(page)).completed).toEqual(['lighting'])
  expect((await snapshot(page)).powerSwitchCount).toBe(0)
  expect((await snapshot(page)).cabinLighting.ambientIntensity).toBe(0.65)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('closed')
})

test('Crew Access scans once into a compact physical identity and resets crew progress on refresh', async ({
  page,
}) => {
  await approachCrew(page)
  await expect(
    page.locator('.interaction-hint'),
    JSON.stringify(await snapshot(page)),
  ).toContainText('Crew Access')
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Crew Access' })
  await expect(
    dialog.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expect(
    dialog.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: /Master’s Degree/ }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('img', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  const pane = dialog.locator('.portfolio-content')
  expect(
    await pane.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true)
  expect((await protocol(page)).completed).toContain('crew')
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'identity', { timeout: 30000 })
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await page.reload()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toBeVisible({ timeout: 60000 })
  expect((await protocol(page)).completed).toEqual(['lighting'])
})

test('cancelled Crew Access does not authenticate', async ({ page }) => {
  await approachCrew(page)
  await expect(page.locator('.interaction-hint')).toBeVisible()
  await page.keyboard.press('e')
  // Cancel during approach, before the short scan can finish on a slow runner.
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('dialog', { name: 'Crew Access' }),
  ).not.toBeVisible()
  await page.waitForTimeout(1400)
  expect((await protocol(page)).completed ?? []).not.toContain('crew')
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
  const checkFormFit = async () => {
    expect(
      await dialog
        .locator('.desktop-content')
        .evaluate(
          (el) =>
            el.scrollHeight <= el.clientHeight &&
            el.scrollWidth <= el.clientWidth,
        ),
    ).toBe(true)
    await expect(
      form.getByRole('button', { name: 'Skip', exact: true }),
    ).toBeInViewport()
    await expect(
      form.getByRole('button', { name: 'Send Transmission' }),
    ).toBeInViewport()
  }
  await checkFormFit()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'communications', { timeout: 30000 })
  await form.getByRole('button', { name: 'Skip', exact: true }).click()
  expect(sends).toBe(0)
  await checkFormFit()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'transmissionSkipped', {
    timeout: 30000,
  })
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
  await checkFormFit()
  await expect(
    form.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveValue('A test only.')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('status')).toContainText('accepted')
  expect(sends).toBe(2)
  await checkFormFit()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'transmissionAccepted', {
    timeout: 30000,
  })
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
  const checkDesktopFit = async () => {
    expect(
      await dialog
        .locator('.desktop-content')
        .evaluate(
          (el) =>
            el.scrollWidth <= el.clientWidth &&
            el.scrollHeight <= el.clientHeight,
        ),
    ).toBe(true)
  }
  await checkDesktopFit()
  await expect(
    dialog.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await dialog
    .getByRole('button', { name: 'Crew Dossier.pdf', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  const download = page.waitForEvent('download')
  await dialog.getByRole('link', { name: /Download CV/ }).click()
  expect(await (await download).failure()).toBeNull()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'dossier', { timeout: 30000 })
  await page.keyboard.press('Escape')
  await dialog
    .getByRole('button', { name: 'Command Terminal', exact: true })
    .click()
  await expect(dialog.getByRole('textbox')).toBeVisible()
  await checkDesktopFit()
  await page.keyboard.press('Escape')
  await dialog
    .getByRole('button', { name: 'Project Gallery', exact: true })
    .click()
  await expect(dialog.getByRole('img', { name: /RouteWise/ })).toBeVisible()
  await checkDesktopFit()
  await dialog.getByRole('button', { name: 'Next image' }).click()
  await expect(
    dialog.getByRole('img', { name: /RouteWise itinerary/ }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
})

test('held tablet keeps movement and real mouse capture, focus pauses and Skip resumes', async ({
  page,
}) => {
  await enterObservationRoom(page)
  await walkTo(page, -2.4, 3.1)
  await lookAt(page, {
    x: -2.4,
    y: (await snapshot(page)).cameraPosition.y,
    z: -4,
  })
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

test('optional tactical table reads session state, supports inspection and returns to FPS', async ({
  page,
}) => {
  await enterObservationRoom(page)
  await approach(page, { x: 0, y: 1.05, z: 0.5 }, 'E · Tactical Table')
  await expect(
    page.getByText('E · Tactical Table', { exact: true }),
    JSON.stringify(await snapshot(page)),
  ).toBeVisible()
  const before = await snapshot(page)
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Tactical Table' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'Station Overview' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Docking Bay' }).click()
  await expect(dialog.getByText('Docking status unavailable.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Systems', exact: true }).click()
  await expect(dialog.getByText('Online', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Mission Log' }).click()
  await expect(dialog.getByRole('listitem')).toHaveCount(6)
  await dialog.getByRole('button', { name: 'Rotate right' }).click()
  await dialog.getByRole('slider', { name: 'Zoom' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByRole('slider')).toHaveValue('0.85')
  const focused = await snapshot(page)
  expect(focused.cameraPosition.x).toBeLessThan(-1.05)
  expect(focused.cameraPosition.z).toBeCloseTo(0.5, 2)
  console.log(
    'tactical-render-sample',
    JSON.stringify({
      drawCalls: focused.drawCalls,
      triangles: focused.triangles,
      frameMs: focused.frameMs,
    }),
  )
  expect(focused.session.protocol).toEqual(before.session.protocol)
  await dialog.getByRole('button', { name: 'Leave terminal' }).click()
  await expect(dialog).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraPosition.z - before.cameraPosition.z,
      ),
    )
    .toBeLessThan(0.05)
})
