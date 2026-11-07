import { expect, test, type Page } from '@playwright/test'
import { forwardStation, enterObservationRoom, snapshot } from './helpers/game'

const errors = new WeakMap<Page, string[]>()

test.beforeEach(({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    // The mocked HTTP 503 in the contact regression is deliberate.
    if (
      message.type() === 'error' &&
      !(
        message.location().url.endsWith('/api/contact') &&
        message.text().includes('503')
      )
    )
      collected.push(message.text())
  })
})

test.afterEach(({ page }) => {
  expect(errors.get(page) ?? []).toEqual([])
})

async function ready(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 60_000 })
}

async function expectPhysicalScreen(page: Page) {
  const screen = page.locator('.physical-archive')
  const dialog = page.getByRole('dialog', { name: 'Central Archive' })
  await expect(dialog).toBeVisible()
  await expect(screen).toBeVisible()
  await expect(
    screen.getByRole('heading', { name: 'Central Archive' }),
  ).toBeVisible()
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Viewport unavailable')
  // The DOM display is inset within the viewport, leaving room for the real frame.
  // Html mounts its DOM before the first frame applies the world transform.
  await expect
    .poll(
      async () => {
        const box = await screen.boundingBox()
        return (
          !!box &&
          box.x > 0 &&
          box.y > 0 &&
          box.x + box.width < viewport.width &&
          box.y + box.height < viewport.height
        )
      },
      {
        message:
          'Physical screen must settle within the viewport with frame margins',
      },
    )
    .toBe(true)
    .catch(async (error: unknown) => {
      const layout = await screen.evaluate((element) => {
        const result = []
        let node: HTMLElement | null = element as HTMLElement
        while (node) {
          const style = getComputedStyle(node)
          const bounds = node.getBoundingClientRect()
          result.push({
            tag: node.tagName,
            className: node.className,
            transform: style.transform,
            position: style.position,
            width: style.width,
            height: style.height,
            bounds: {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
          })
          node = node.parentElement
        }
        return result
      })
      console.log('Physical screen DOM geometry:', JSON.stringify(layout))
      throw error
    })
  expect(
    await screen.evaluate((element) => {
      let node: HTMLElement | null = element as HTMLElement
      while (node) {
        if (getComputedStyle(node).transform.startsWith('matrix3d('))
          return true
        node = node.parentElement
      }
      return false
    }),
  ).toBe(true)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  const box = await screen.boundingBox()
  if (!box) throw new Error('Physical screen has no layout')
  const camera = (await snapshot(page)).cameraPosition
  const projectedWidth =
    (1.6 / (2 * Math.tan((65 * Math.PI) / 360) * (camera.z + 3.715))) *
    viewport.height
  expect(Math.abs(box.width - projectedWidth)).toBeLessThan(2)
  expect(Math.abs(box.height - (box.width * 0.9) / 1.6)).toBeLessThan(2)
  return dialog
}

test('approaches the physical Archive with E, reads records, downloads CV and exits with real Pointer Lock', async ({
  page,
}) => {
  await ready(page)
  await enterObservationRoom(page)
  await forwardStation(page, -1)
  await page.waitForTimeout(200)
  const before = await snapshot(page)
  await page.keyboard.press('e')
  const dialog = await expectPhysicalScreen(page)
  const close = dialog.getByRole('button', { name: 'Exit computer' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: 'Profile', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(close).toBeFocused()
  await dialog
    .getByRole('button', { name: 'Service Record', exact: true })
    .click()
  await expect(
    dialog.getByRole('heading', { name: 'Service Record', exact: true }),
  ).toBeFocused()
  await expect(dialog.getByRole('heading', { name: 'Blue Alba' })).toBeVisible()
  const content = dialog.locator('.portfolio-content')
  await content.hover()
  await page.mouse.wheel(0, 700)
  await expect
    .poll(() => content.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  const downloadEvent = page.waitForEvent('download')
  await dialog
    .getByRole('link', { name: 'Download CV (PDF)', exact: true })
    .click()
  const download = await downloadEvent
  expect(await download.failure()).toBeNull()
  expect(download.suggestedFilename()).toBe('joaquin-pettinari-cv.pdf')
  await close.click()
  await expect(dialog).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraPosition.z - before.cameraPosition.z,
      ),
    )
    .toBeLessThan(0.08)
  const after = await snapshot(page)
  expect(after.cameraPosition.x).toBeCloseTo(before.cameraPosition.x, 2)
  expect(after.cameraPosition.y).toBeCloseTo(before.cameraPosition.y, 2)
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
})

test('quick access focuses the same physical Archive from the airlock without completing or gating missions', async ({
  page,
}) => {
  await ready(page)
  await page.keyboard.press('Escape')
  const before = await snapshot(page)
  const progress = await page.evaluate(() =>
    localStorage.getItem('cruz-del-sur.protocol'),
  )
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  const dialog = await expectPhysicalScreen(page)
  await expect(
    dialog.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('cruz-del-sur.protocol')),
  ).toBe(progress)
  await page.setViewportSize({ width: 960, height: 640 })
  await expectPhysicalScreen(page)
  await dialog.getByRole('button', { name: 'Projects', exact: true }).click()
  await dialog.getByRole('button', { name: /RouteWise/ }).click()
  await expect(
    dialog.getByRole('heading', { name: 'RouteWise', exact: true }),
  ).toBeFocused()
  await page.setViewportSize({ width: 390, height: 844 })
  await expectPhysicalScreen(page)
  // E closes the same focused monitor and recaptures from a real key gesture.
  await page.keyboard.press('e')
  await expect(dialog).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraPosition.z - before.cameraPosition.z,
      ),
    )
    .toBeLessThan(0.08)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraPosition.z - before.cameraPosition.z,
      ),
    )
    .toBeLessThan(0.08)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await page
    .getByRole('button', { name: 'Accessible HTML portfolio', exact: true })
    .click()
  await expect(page.locator('.quick-portfolio')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.physical-archive')).toHaveCount(0)
})

test('unavailable WebGL retains the direct HTML portfolio on a small viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.startsWith('webgl') || kind === 'experimental-webgl')
          return null
        return Reflect.apply(original, this, [kind, ...args])
      },
    })
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Contact', exact: true }).click()
  await expect(
    page.getByRole('form', { name: 'Earth Communications' }),
  ).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('physical Archive contact preserves the failed draft and confirms only a mocked accepted retry', async ({
  page,
}) => {
  let attempts = 0
  await page.route('**/api/contact', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toMatchObject({
      name: 'Test Visitor',
      email: 'visitor@example.com',
      message: 'A test transmission only.',
    })
    attempts++
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { error: 'Unavailable' } }
        : { status: 200, json: { accepted: true } },
    )
  })
  await ready(page)
  await page.keyboard.press('Escape')
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  const dialog = await expectPhysicalScreen(page)
  await dialog.getByRole('button', { name: 'Contact', exact: true }).click()
  const form = dialog.getByRole('form', { name: 'Earth Communications' })
  await form
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Test Visitor')
  await form
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('visitor@example.com')
  await form
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('A test transmission only.')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('alert')).toContainText(
    'Transmission was not confirmed',
  )
  await expect(
    form.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveValue('A test transmission only.')
  await expect(form.getByRole('status')).not.toContainText('accepted')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('status')).toContainText(
    'Transmission accepted by the email provider',
  )
  await expect(form.getByRole('status')).toBeFocused()
  await expect(
    form.getByRole('button', { name: 'Send Transmission' }),
  ).toBeDisabled()
  expect(attempts).toBe(2)
  expect((await snapshot(page)).pointerLocked).toBe(false)
})
