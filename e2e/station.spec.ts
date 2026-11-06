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
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await expect
    .poll(() => page.evaluate(() => !!window.__GAME_DEBUG__))
    .toBe(true)
})

const collectors = new WeakMap<Page, string[]>()

test('toggles ambient sound without capturing the mouse', async ({ page }) => {
  const sound = page.getByRole('button', { name: 'Ambient sound' })
  await expect(sound).toHaveAttribute('aria-pressed', 'false')
  await sound.click()
  await expect(sound).toHaveAttribute('aria-pressed', 'true')
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await sound.click()
  await expect(sound).toHaveAttribute('aria-pressed', 'false')
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await page.screenshot({ path: 'artifacts/station-audio.png' })
})
test.afterEach(async ({ page }, info) => {
  const errors = collectors.get(page) ?? []
  await info.attach('browser-errors', {
    body: JSON.stringify(errors),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})

async function enter(page: Page) {
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not ready')
  await canvas.click({
    position: { x: bounds.width / 2, y: bounds.height / 2 },
  })
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
}

test('walking while turning keeps small mouse inputs bounded', async ({
  page,
}, info) => {
  test.setTimeout(60_000)
  await enter(page)
  await page.mouse.move(640, 360)
  const samples: GameSnapshot[] = [await snapshot(page)]
  await page.keyboard.down('w')
  try {
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(640 + step * 5, 360)
      await page.waitForTimeout(50)
      samples.push(await snapshot(page))
    }
  } finally {
    await page.keyboard.up('w')
  }
  await info.attach('walking-turning-samples', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  })
  for (let index = 1; index < samples.length; index++) {
    const a = samples[index - 1].cameraRotation
    const b = samples[index].cameraRotation
    const dot = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)
    expect(2 * Math.acos(Math.min(1, dot))).toBeLessThan(0.2)
    expect(samples[index].cameraPosition.y).toBeCloseTo(
      samples[0].cameraPosition.y,
      1,
    )
  }
  const start = samples[0].cameraPosition
  const end = samples.at(-1)!.cameraPosition
  expect(Math.hypot(end.x - start.x, end.z - start.z)).toBeGreaterThan(0.1)
})

test('loads the scene and records a rendering baseline', async ({
  page,
}, info) => {
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(/Move WASD · Look Mouse/)).toBeVisible()
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
    page.getByRole('button', { name: 'Click to control the mouse' }),
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

test('walks forward, collides with chair, and stops when the key is released', async ({
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
  // Chair front is z=-1.88, plus the player's capsule radius of 0.3.
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(-1.5)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(-1.65)
  await page.keyboard.up('w')
  const stopped = await snapshot(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    stopped.cameraPosition.z,
    2,
  )
  await page.screenshot({ path: 'artifacts/station-desk.png' })
})

test('opens the computer directly and returns to walking', async ({ page }) => {
  test.setTimeout(120_000)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const verifyProjectImages = async () => {
    const images = page.locator('.project-gallery img')
    expect(await images.count()).toBeGreaterThan(0)
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          image.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0)
      await expect(image).not.toHaveAttribute('alt', '')
    }
    await page.locator('#computer-title').scrollIntoViewIfNeeded()
  }
  await enter(page)
  await page.screenshot({ path: 'artifacts/observatory-room.png' })
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(-0.9)
  await page.keyboard.up('w')
  await page.waitForTimeout(200)
  const standing = await snapshot(page)
  await expect(
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('E · Sit down', { exact: true }),
  ).not.toBeVisible()
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await expect(
    page.getByRole('button', { name: 'Exit computer' }),
  ).toBeFocused()
  await page.screenshot({ path: 'artifacts/observatory-computer.png' })
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Projects', exact: true })
    .click()
  await page.getByRole('button', { name: /RouteWise/ }).click()
  await verifyProjectImages()
  await page.screenshot({ path: 'artifacts/routewise-project.png' })
  await expect(page.getByText(/simulated prices and schedules/i)).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Frontend source code' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/JoaquinPettinariUEM/TFM-Airports-Front',
  )
  await page.getByRole('button', { name: 'Back to projects' }).click()
  await page.getByRole('button', { name: /AccesiWeb/ }).click()
  await expect(page.getByRole('heading', { name: 'AccesiWeb' })).toBeVisible()
  await verifyProjectImages()
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Experience', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Blue Alba' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download CV (PDF)' }).click()
  const download = await downloadPromise
  expect(await download.failure()).toBeNull()
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Contact', exact: true })
    .click()
  await expect(
    page.getByRole('link', { name: /joaquinpettinari@hotmail.com/ }),
  ).toHaveAttribute('href', 'mailto:joaquinpettinari@hotmail.com')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeEnabled()
  await page.waitForTimeout(1200)
  await enter(page)
  await expect(
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Exit computer' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).not.toBeVisible()
  await expect(
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeCloseTo(standing.cameraPosition.z, 1)
  await page.keyboard.down('s')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeGreaterThan(standing.cameraPosition.z + 0.3)
  await page.keyboard.up('s')
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

test('animates the exterior, respects reduced motion, and blocks the rear door', async ({
  page,
}) => {
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.stars)
    .not.toBeNull()
  const before = (await snapshot(page)).spaceMotion
  expect(before.orbit).not.toBeNull()
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.orbit)
    .not.toBe(before.orbit)
  expect(before.asteroid).not.toBeNull()
  expect(before.shuttle).not.toBeNull()
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.asteroid)
    .not.toBe(before.asteroid)
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.shuttle)
    .not.toBe(before.shuttle)
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.stars)
    .toBeGreaterThan(before.stars!)
  await expect
    .poll(async () => (await snapshot(page)).spaceMotion.planet)
    .toBeGreaterThan(before.planet!)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(150)
  const still = (await snapshot(page)).spaceMotion
  await page.waitForTimeout(300)
  expect((await snapshot(page)).spaceMotion).toEqual(still)
  await enter(page)
  await page.keyboard.down('s')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeGreaterThan(4.3)
  await page.waitForTimeout(300)
  await page.keyboard.up('s')
  expect((await snapshot(page)).cameraPosition.z).toBeLessThan(4.5)
  await page.mouse.move(640, 360)
  await page.mouse.move(2211, 360, { steps: 20 })
  await page.screenshot({ path: 'artifacts/observatory-door.png' })
})

test('chamfered hull blocks diagonal walking and wings are visible from the side', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await enter(page)
  await page.keyboard.down('d')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(4.4)
  await page.keyboard.up('d')
  await page.mouse.move(640, 360)
  await page.mouse.move(1425, 470, { steps: 16 })
  await page.screenshot({ path: 'artifacts/ship-wing.png' })
  await page.mouse.move(640, 360, { steps: 16 })
  await page.keyboard.down('d')
  await page.keyboard.down('s')
  await expect
    .poll(async () => {
      const { x, z } = (await snapshot(page)).cameraPosition
      return x + z
    })
    .toBeGreaterThan(8.5)
  await page.waitForTimeout(400)
  await page.keyboard.up('d')
  await page.keyboard.up('s')
  const corner = (await snapshot(page)).cameraPosition
  expect(corner.x + corner.z).toBeLessThan(9)
  expect(corner.x).toBeLessThan(4.8)
  expect(corner.z).toBeLessThan(4.8)
})

test('tablet pauses movement, locates independent objectives and closes safely', async ({
  page,
}) => {
  await enter(page)
  await page.keyboard.down('w')
  await page.keyboard.press('t')
  await page.keyboard.up('w')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  const stopped = (await snapshot(page)).cameraPosition
  await page.keyboard.press('w')
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(stopped.z, 2)
  await tablet
    .getByRole('button', { name: /Prepare Earth transmission/ })
    .hover()
  await expect(tablet.locator('.map-objective')).toContainText(
    'Open an email draft',
  )
  await tablet.getByRole('button', { name: /Run ship diagnostics/ }).focus()
  await expect(tablet.locator('.map-objective')).toContainText('Experience')
  await page.screenshot({ path: 'artifacts/mission-tablet.png' })
  await page.keyboard.press('Escape')
  await expect(tablet).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeVisible()
})

test('rear crew dossier downloads with E and mouse hint only follows Escape', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const hint = page.getByRole('button', { name: 'Click to control the mouse' })
  await expect(hint).not.toBeVisible()
  await page.getByRole('button', { name: 'Mission tablet · T' }).click()
  await page.getByRole('button', { name: 'Close tablet' }).click()
  await expect(hint).not.toBeVisible()
  await enter(page)
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(2.6)
  await page.keyboard.up('w')
  await page.keyboard.down('a')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeLessThan(-3.1)
  await page.keyboard.up('a')
  await page.mouse.move(640, 360)
  await page.mouse.move(2211, 360, { steps: 20 })
  const rearView = await snapshot(page)
  const desiredYaw = Math.atan2(
    3.25 + rearView.cameraPosition.x,
    rearView.cameraPosition.z - 4.77,
  )
  const currentYaw =
    2 * Math.atan2(rearView.cameraRotation.y, rearView.cameraRotation.w)
  const yawDelta = Math.atan2(
    Math.sin(desiredYaw - currentYaw),
    Math.cos(desiredYaw - currentYaw),
  )
  await page.mouse.move(2211 - yawDelta / 0.002, 360, { steps: 8 })
  await expect(
    page.getByText('E · Download crew dossier (CV / PDF)', { exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'artifacts/crew-dossier-wall.png' })
  const downloaded = page.waitForEvent('download')
  await page.keyboard.press('e')
  const file = await downloaded
  expect(await file.failure()).toBeNull()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('2 / 6 complete')
  await page.keyboard.press('Escape')
  await expect(hint).toBeVisible()
})

test('Space jumps once while held, lands and remains disabled in the tablet', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.waitForTimeout(400)
  const ground = (await snapshot(page)).cameraPosition.y
  await page.keyboard.down('Space')
  await expect
    .poll(async () => (await snapshot(page)).maxEyeHeight, {
      intervals: [30, 50, 100],
    })
    .toBeGreaterThan(ground + 0.2)
  await expect
    .poll(
      async () => Math.abs((await snapshot(page)).cameraPosition.y - ground),
      { intervals: [100] },
    )
    .toBeLessThan(0.04)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.y).toBeCloseTo(ground, 1)
  await page.keyboard.up('Space')
  await page.keyboard.press('t')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Activate crew hologram/ }).focus()
  await page.keyboard.press('Space')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.y).toBeCloseTo(ground, 1)
})

test('tablet objective completes and table projects the crew record from a distance', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.keyboard.press('t')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(
    tablet.getByRole('button', { name: /Open mission tablet/ }),
  ).toHaveAttribute('data-complete', 'true')
  await expect(tablet).toContainText('1 / 6 objectives complete')
  await tablet.getByRole('button', { name: /Activate crew hologram/ }).hover()
  await expect(tablet.locator('.map-objective')).toContainText(
    'Central projection table',
  )
  await page.getByRole('button', { name: 'Close tablet' }).click()
  await expect(page.locator('.mission-checklist li').first()).toHaveAttribute(
    'data-complete',
    'true',
  )
  await enter(page)
  await page.mouse.move(640, 360)
  await page.mouse.move(915, 435, { steps: 12 })
  await expect(
    page.getByText('E · Activate crew hologram', { exact: true }),
  ).toBeVisible()
  const standing = await snapshot(page)
  await page.keyboard.press('e')
  const hologram = page.getByRole('dialog', { name: 'Joaquín Pettinari' })
  await expect(hologram).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(2.8, 1)
  await page.mouse.click(640, 320)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await page.screenshot({ path: 'artifacts/crew-hologram.png' })
  await hologram.getByRole('button', { name: 'Training record' }).click()
  await expect(hologram.getByRole('heading', { name: /Master/ })).toBeVisible()
  await hologram.getByRole('button', { name: 'Leave hologram' }).click()
  await expect(hologram).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('2 / 6 complete')
})
