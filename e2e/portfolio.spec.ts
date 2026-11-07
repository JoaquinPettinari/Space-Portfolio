import { expect, test, type Page } from '@playwright/test'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

const errors = new WeakMap<Page, string[]>()

test.beforeEach(({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
})

test.afterEach(async ({ page }, info) => {
  const collected = errors.get(page) ?? []
  await info.attach('browser-errors', {
    body: JSON.stringify(collected),
    contentType: 'application/json',
  })
  expect(collected).toEqual([])
})

test('reads the complete mobile portfolio through the unavailable-WebGL fallback without mouse capture or audio', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const calls = { webgl: 0, pointerLock: 0, audio: 0 }
    Object.defineProperty(window, '__portfolioApiCalls', { value: calls })
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.startsWith('webgl') || kind === 'experimental-webgl') {
          calls.webgl += 1
          return null
        }
        return Reflect.apply(original, this, [kind, ...args])
      },
    })
    Object.defineProperty(Element.prototype, 'requestPointerLock', {
      value: () => {
        calls.pointerLock += 1
        throw new Error('Quick access must not capture the mouse')
      },
    })
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          calls.audio += 1
          throw new Error('Quick access must not require audio')
        }
      },
    })
  })
  const gameRequests: string[] = []
  page.on('request', (request) => {
    if (
      /\/src\/game\/Game\.tsx|@react-three|rapier|three\.js/.test(request.url())
    ) {
      gameRequests.push(request.url())
    }
  })
  await page.goto('/')
  await expect(page.getByText(/3D mode is unavailable/)).toBeVisible()
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(/Full-Stack Developer · Milan, Italy/),
  ).toBeVisible()
  const nav = page.getByRole('navigation')
  await nav.getByRole('button', { name: 'Projects', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: /RouteWise/ }).click()
  await expect(
    page.getByRole('heading', { name: 'RouteWise', exact: true }),
  ).toBeFocused()
  await expect(page.getByText(/simulated prices and schedules/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Frontend source code/ }),
  ).toHaveAttribute(
    'href',
    'https://github.com/JoaquinPettinariUEM/TFM-Airports-Front',
  )
  await page.getByRole('button', { name: 'Back to projects' }).click()
  await page.getByRole('button', { name: /AccesiWeb/ }).click()
  await expect(
    page.getByText(/does not certify comprehensive compliance/),
  ).toBeVisible()
  await nav.getByRole('button', { name: 'Service Record', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Blue Alba' })).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page
    .getByRole('link', { name: 'Download CV (PDF)', exact: true })
    .click()
  const download = await downloadEvent
  expect(await download.failure()).toBeNull()
  expect(download.suggestedFilename()).toBe('joaquin-pettinari-cv.pdf')
  await nav.getByRole('button', { name: 'Training', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: /Master’s Degree/ }),
  ).toBeVisible()
  await nav.getByRole('button', { name: 'Contact', exact: true }).click()
  await expect(
    page.getByRole('link', { name: /joaquinpettinari@hotmail.com/ }),
  ).toHaveAttribute('href', 'mailto:joaquinpettinari@hotmail.com')
  await expect(
    page.getByRole('form', { name: 'Earth Communications' }),
  ).toBeVisible()
  await nav.getByRole('button', { name: 'Profile', exact: true }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByText(/3D mode is unavailable/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Quick Portfolio Access', exact: true }),
  ).toBeFocused()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(gameRequests).toEqual([])
  const calls = await page.evaluate(() =>
    '__portfolioApiCalls' in window ? window.__portfolioApiCalls : null,
  )
  expect(calls).toMatchObject({ pointerLock: 0, audio: 0 })
  expect(calls).toHaveProperty('webgl')
  expect(
    await page.evaluate(() =>
      '__portfolioApiCalls' in window &&
      typeof window.__portfolioApiCalls === 'object' &&
      window.__portfolioApiCalls !== null &&
      'webgl' in window.__portfolioApiCalls
        ? window.__portfolioApiCalls.webgl
        : 0,
    ),
  ).toBeGreaterThan(0)
  expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
})

test('keeps the portfolio accessible when WebGL is unavailable', async ({
  page,
}) => {
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
  await expect(page.getByText(/3D mode is unavailable/)).toBeVisible()
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download CV (PDF)', exact: true }),
  ).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}

test('opens the accessible HTML alternative from pause and returns without losing position, progress or control safety', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not ready')
  const enter = async () => {
    await canvas.click({
      position: { x: bounds.width / 2, y: bounds.height / 2 },
    })
    await expect
      .poll(async () => (await snapshot(page)).pointerLocked)
      .toBe(true)
  }
  await enter()
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z, {
      intervals: [30, 50],
    })
    .toBeLessThan(6)
  await page.keyboard.up('w')
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeVisible()
  const before = await snapshot(page)
  await page
    .getByRole('button', { name: 'Accessible HTML portfolio', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await page.keyboard.down('w')
  await page.keyboard.press('t')
  await page.keyboard.press('e')
  await page.waitForTimeout(200)
  expect((await snapshot(page)).cameraPosition).toEqual(before.cameraPosition)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).not.toBeVisible()
  await page
    .getByRole('button', { name: 'Back to station', exact: true })
    .click()
  await expect(canvas).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 6 complete')
  expect((await snapshot(page)).pointerLocked).toBe(false)
  expect((await snapshot(page)).cameraPosition).toEqual(before.cameraPosition)
  await page.waitForTimeout(1200)
  await enter()
  await page.waitForTimeout(200)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    before.cameraPosition.z,
    2,
  )
  await page.keyboard.up('w')
})

test('offers quick access only as a secondary pause route, not an entry choice', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('canvas')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Enter station', exact: true }),
  ).toHaveCount(0)
  const quick = page.getByRole('button', {
    name: 'Quick Portfolio Access',
    exact: true,
  })
  await expect(quick).not.toBeVisible()
  await page.keyboard.press('Escape')
  await expect(quick).toBeVisible()
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  await expect(quick).not.toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tablet).not.toBeVisible()
  await expect(quick).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
})

test.describe('mobile touch pause route', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  test('opens the secondary portfolio by touch without a keyboard or mouse capture', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()
    const pause = page.getByRole('button', {
      name: 'Pause station',
      exact: true,
    })
    await expect(pause).toBeVisible({ timeout: 45_000 })
    const quick = page.getByRole('button', {
      name: 'Quick Portfolio Access',
      exact: true,
    })
    await expect(quick).not.toBeVisible()
    expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
    const [missionBounds, subtitleBounds] = await Promise.all([
      page
        .getByRole('complementary', { name: 'Recovery objectives' })
        .boundingBox(),
      page.getByRole('status', { name: 'Station assistant' }).boundingBox(),
    ])
    expect(missionBounds).not.toBeNull()
    expect(subtitleBounds).not.toBeNull()
    expect(subtitleBounds!.y).toBeGreaterThanOrEqual(
      missionBounds!.y + missionBounds!.height,
    )
    await pause.tap()
    await expect(quick).toBeVisible()
    await page
      .getByRole('button', { name: 'Accessible HTML portfolio', exact: true })
      .tap()
    await expect(
      page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Download CV (PDF)', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
    await page
      .getByRole('button', { name: 'Back to station', exact: true })
      .tap()
    await expect(page.locator('canvas')).toBeVisible()
    expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
  })
})
