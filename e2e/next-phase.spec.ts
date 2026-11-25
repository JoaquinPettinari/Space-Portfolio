import { BRIDGE_OFFSET_Z } from '../src/game/world/bridgePlacement'
import { TERMINAL_SCREENS } from '../src/game/interaction/station'
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
  expect((await snapshot(page)).cabinLighting.ambientIntensity).toBe(0.5)
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
  ).toHaveAttribute('data-dialogue-event', 'crewVerified', { timeout: 30000 })
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
  await walkTo(page, 2, 0.3)
  const [x, y, z] = TERMINAL_SCREENS.personal.position
  await approach(page, { x, y, z }, 'E Personal Workstation')
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

test('held tablet keeps movement and real mouse capture; R is inert and T lowers it', async ({
  page,
}, info) => {
  await enterObservationRoom(page)
  await walkTo(page, -2.4, 3.1 + BRIDGE_OFFSET_Z)
  await lookAt(page, {
    x: -2.4,
    y: (await snapshot(page)).cameraPosition.y,
    z: -4,
  })
  await page.keyboard.press('t')
  const held = page.getByRole('region', { name: 'Held mission tablet' })
  await expect(held).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await expect(held).toBeInViewport({ ratio: 1 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: info.outputPath('tablet-held.png') })
  const before = (await snapshot(page)).cameraPosition.z
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(before - 0.4)
    await page.keyboard.press('r')
    const afterR = (await snapshot(page)).cameraPosition.z
    await expect(held).toBeVisible()
    await expect(
      page.getByRole('dialog', { name: 'Mission tablet' }),
    ).toHaveCount(0)
    expect((await snapshot(page)).pointerLocked).toBe(true)
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(afterR - 0.15)
  } finally {
    await page.keyboard.up('w')
  }
  await page.screenshot({ path: info.outputPath('tablet-after-r.png') })
  await expect(
    held.getByRole('list', { name: 'Mission progress' }),
  ).toBeVisible()
  await page.keyboard.press('t')
  await expect(held).not.toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await page.keyboard.press('Escape')
  expect((await snapshot(page)).pointerLocked).toBe(false)
})

test('optional tactical table reads session state, supports inspection and returns to FPS', async ({
  page,
}, info) => {
  await enterObservationRoom(page)
  await walkTo(page, 0, -0.2)
  await approach(
    page,
    { x: 0, y: 1.04, z: 1.65 + BRIDGE_OFFSET_Z },
    'E · Tactical Table',
  )
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Tactical Table' }),
    JSON.stringify(await snapshot(page)),
  ).toBeVisible()
  const before = await snapshot(page)
  await page.screenshot({ path: info.outputPath('tactical-before.png') })
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'Tactical Table' })
  await expect(dialog).toBeVisible()
  const opened = await snapshot(page)
  expect(before.tacticalModelPosition).not.toBeNull()
  expect(opened.tacticalModelPosition).toEqual(before.tacticalModelPosition)
  await page.screenshot({ path: info.outputPath('tactical-open.png') })
  await expect(
    dialog.getByRole('heading', { name: 'Detected issues' }),
  ).toBeVisible()
  await expect(dialog.getByText('Comms offline')).toBeVisible()
  await expect(dialog.getByRole('listitem')).toHaveCount(7)
  await expect(dialog.getByRole('slider')).toHaveCount(0)
  const focused = await snapshot(page)
  expect(focused.cameraPosition.x).toBeLessThan(-1.05)
  expect(focused.cameraPosition.z).toBeCloseTo(
    TERMINAL_SCREENS.tactical.position[2],
    2,
  )
  expect(focused.tacticalModelPosition).toEqual(before.tacticalModelPosition)
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
  expect((await snapshot(page)).tacticalModelPosition).toEqual(
    before.tacticalModelPosition,
  )
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraPosition.z - before.cameraPosition.z,
      ),
    )
    .toBeLessThan(0.05)
})
