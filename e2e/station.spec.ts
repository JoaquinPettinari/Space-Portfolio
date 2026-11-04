import { expect, test, type Page } from '@playwright/test'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  collectors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  // Each test fails on console errors, including errors generated late in a flow.
  test.info().annotations.push({
    type: 'console',
    description: 'Unexpected errors fail this test',
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Cargar experiencia 3D' }).click()
  await expect(
    page.getByRole('button', { name: 'Entrar / continuar' }),
  ).toBeEnabled()
  await expect
    .poll(() => page.evaluate(() => !!window.__GAME_DEBUG__))
    .toBe(true)
})

const collectors = new WeakMap<Page, string[]>()
test.afterEach(async ({ page }, info) => {
  const errors = collectors.get(page) ?? []
  await info.attach('browser-errors', {
    body: JSON.stringify(errors),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})

async function enter(page: Page) {
  await page.getByRole('button', { name: 'Entrar / continuar' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
}

test('loads the scene and records a rendering baseline', async ({
  page,
}, info) => {
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(/WASD · Mouse · ESC/)).toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).drawCalls)
    .toBeGreaterThan(0)
  await info.attach('render-baseline', {
    body: JSON.stringify(await snapshot(page), null, 2),
    contentType: 'application/json',
  })
  await page.screenshot({ path: 'artifacts/station-menu.png' })
})

test('captures real pointer lock, turns, releases and resumes without held keys', async ({
  page,
}) => {
  await enter(page)
  const before = await snapshot(page)
  await page.mouse.move(640, 360)
  await page.mouse.move(680, 360, { steps: 8 })
  await expect
    .poll(async () =>
      Math.abs(
        (await snapshot(page)).cameraRotation.y - before.cameraRotation.y,
      ),
    )
    .toBeGreaterThan(0.001)
  let previous = await snapshot(page)
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(680 + step * 5, 360)
    const current = await snapshot(page)
    const a = previous.cameraRotation
    const b = current.cameraRotation
    const dot = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)
    // Five-pixel inputs should not cause a sudden turn of more than ~11 degrees.
    expect(2 * Math.acos(Math.min(1, dot))).toBeLessThan(0.2)
    expect(current.cameraPosition.x).toBeCloseTo(previous.cameraPosition.x, 2)
    expect(current.cameraPosition.z).toBeCloseTo(previous.cameraPosition.z, 2)
    previous = current
  }
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  await expect(
    page.getByRole('button', { name: 'Entrar / continuar' }),
  ).toBeVisible()
  // Browsers enforce a short lock cooldown after Escape. Wait for user-like re-entry.
  await page.waitForTimeout(1200)
  await enter(page)
  const resumed = await snapshot(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(
    resumed.cameraPosition.x,
    2,
  )
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    resumed.cameraPosition.z,
    2,
  )
})

test('walks forward, collides with desk, and stops when the key is released', async ({
  page,
}) => {
  await enter(page)
  const start = await snapshot(page)
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(start.cameraPosition.z - 0.5)
  await page.keyboard.up('w')
  await page.waitForTimeout(100) // Allow the last physics step/interpolation to finish.
  const openFloorStop = await snapshot(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    openFloorStop.cameraPosition.z,
    2,
  )
  await page.keyboard.down('w')
  // Desk front is z=-3.1; the player's capsule has radius 0.3.
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z, {
      timeout: 10_000,
    })
    .toBeLessThan(-2.7)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(-2.85)
  await page.keyboard.up('w')
  const stopped = await snapshot(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    stopped.cameraPosition.z,
    2,
  )
  await page.screenshot({ path: 'artifacts/station-desk.png' })
})

test('side wall blocks the player and Escape clears a held movement key', async ({
  page,
}) => {
  await enter(page)
  await page.keyboard.down('d')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(0.5)
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  const pausedInOpenSpace = await snapshot(page)
  await page.waitForTimeout(1200)
  await enter(page)
  await page.waitForTimeout(300)
  // Keep d physically held: no keyup can mask a broken reset on unlock.
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(
    pausedInOpenSpace.cameraPosition.x,
    2,
  )
  await page.keyboard.up('d')
  await page.keyboard.down('d')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(4.6)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.x).toBeLessThan(4.8)
  await page.keyboard.press('Escape')
  await page.keyboard.up('d')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  const paused = await snapshot(page)
  await page.waitForTimeout(1200)
  await enter(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.x).toBeCloseTo(
    paused.cameraPosition.x,
    2,
  )
})
