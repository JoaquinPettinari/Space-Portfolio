import { expect, test, type Page } from '@playwright/test'
import {
  enter as capture,
  enterObservationRoom,
  forwardStation,
  walkTo,
} from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

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

test.setTimeout(90_000)

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
  if ((await snapshot(page)).cameraPosition.z < 4.5) {
    await capture(page)
  } else {
    await enterObservationRoom(page)
  }
}

async function focusTablet(page: Page) {
  if (await page.getByRole('dialog', { name: 'Mission tablet' }).isVisible())
    return
  const held = page.getByRole('region', { name: 'Held mission tablet' })
  if (!(await held.count())) await page.keyboard.press('t')
  await expect(held).toBeVisible()
  await page.keyboard.press('r')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
}

/** Steer using real mouse input; diagnostics only tell us where we are looking. */
async function lookAt(page: Page, target: { x: number; y: number; z: number }) {
  await page.mouse.move(640, 360)
  const { cameraPosition: position, cameraRotation: q } = await snapshot(page)
  const yaw = Math.atan2(
    2 * (q.x * q.z + q.y * q.w),
    1 - 2 * (q.x * q.x + q.y * q.y),
  )
  const pitch = Math.asin(
    Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z))),
  )
  const desiredYaw = Math.atan2(position.x - target.x, position.z - target.z)
  const desiredPitch = Math.atan2(
    target.y - position.y,
    Math.hypot(target.x - position.x, target.z - position.z),
  )
  const yawDelta = Math.atan2(
    Math.sin(desiredYaw - yaw),
    Math.cos(desiredYaw - yaw),
  )
  // PointerLockControls uses 0.002 radians per input pixel at default sensitivity.
  await page.mouse.move(
    640 - yawDelta / 0.002,
    360 - (desiredPitch - pitch) / 0.002,
    { steps: 16 },
  )
}

test('walking while turning keeps small mouse inputs bounded', async ({
  page,
}, info) => {
  test.setTimeout(120_000)
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
  await expect(
    page.getByRole('button', { name: 'Enter station', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Quick Portfolio Access', exact: true }),
  ).not.toBeVisible()
  await expect(page.getByText(/Move WASD · Look Mouse/)).toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).drawCalls)
    .toBeGreaterThan(0)
  await info.attach('render-baseline', {
    body: JSON.stringify(await snapshot(page), null, 2),
    contentType: 'application/json',
  })
})

test('captures real pointer lock, turns, releases and resumes without held keys', async ({
  page,
}) => {
  test.setTimeout(120_000)
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
  await walkTo(page, -2.4, 3.1)
  await lookAt(page, { x: -2.4, y: 1.7, z: -4 })
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
  // Chair rear is z=-2.43, plus the player's capsule radius of 0.3.
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(-2.05)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(-2.2)
  await page.keyboard.up('w')
  const stopped = await snapshot(page)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(
    stopped.cameraPosition.z,
    2,
  )
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
    await page.locator('.portfolio-content > h2').scrollIntoViewIfNeeded()
  }
  await enter(page)
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await forwardStation(page, -1)
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
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Projects', exact: true })
    .click()
  await page.getByRole('button', { name: /RouteWise/ }).click()
  await verifyProjectImages()
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
    .getByRole('button', { name: 'Service Record', exact: true })
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
  await walkTo(page, 2.4, 3.1)
  await walkTo(page, 2.4, 0)
  await lookAt(page, { x: 2.4, y: 1.7, z: -4 })
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

test('animates the exterior, respects reduced motion, and blocks the rear airlock wall', async ({
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
    .toBeGreaterThan(7.6)
  await page.waitForTimeout(300)
  await page.keyboard.up('s')
  expect((await snapshot(page)).cameraPosition.z).toBeLessThan(7.95)
  await page.mouse.move(640, 360)
  await page.mouse.move(2211, 360, { steps: 20 })
})

test('chamfered hull blocks diagonal walking near the rear corner', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await enter(page)
  await walkTo(page, 3.2, 4.35)
  await lookAt(page, { x: 3.2, y: 1.7, z: -4 })
  await page.keyboard.down('d')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(4.4)
  await page.keyboard.up('d')
  await page.mouse.move(640, 360)
  await page.mouse.move(1425, 470, { steps: 16 })
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

test('focused tablet pauses movement, locates independent objectives and closes safely', async ({
  page,
}) => {
  await enter(page)
  await page.keyboard.down('w')
  await focusTablet(page)
  await page.keyboard.up('w')
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  const stopped = (await snapshot(page)).cameraPosition
  await page.keyboard.press('w')
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(stopped.z, 2)
  await tablet.getByRole('button', { name: /Contact Mission Control/ }).hover()
  await expect(tablet.locator('.map-objective')).toContainText('Contact')
  await tablet
    .getByRole('button', { name: /Review expedition archives/ })
    .focus()
  await expect(tablet.locator('.map-objective')).toContainText('Service Record')
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
    .poll(async () => (await snapshot(page)).cameraPosition.z, {
      intervals: [30, 50],
    })
    .toBeLessThan(2.6)
  await page.keyboard.up('w')
  await page.keyboard.down('a')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x, {
      intervals: [30, 50],
    })
    .toBeLessThan(-3.1)
  await page.keyboard.up('a')
  await lookAt(page, { x: -3.25, y: 1.65, z: 4.77 })
  // The lateral route can overshoot on a slow renderer. Finish the approach
  // towards the visible panel instead of assuming timed walking reached it.
  await page.keyboard.down('w')
  try {
    await expect
      .poll(
        async () => {
          const { x, z } = (await snapshot(page)).cameraPosition
          return Math.hypot(x + 3.25, z - 4.77)
        },
        { intervals: [30, 50] },
      )
      .toBeLessThan(2.3)
  } finally {
    await page.keyboard.up('w')
  }
  await lookAt(page, { x: -3.25, y: 1.65, z: 4.77 })
  const rearView = await snapshot(page)
  await test.info().attach('dossier-approach', {
    body: JSON.stringify(rearView),
    contentType: 'application/json',
  })
  expect(
    Math.hypot(
      rearView.cameraPosition.x + 3.25,
      rearView.cameraPosition.z - 4.77,
    ),
  ).toBeLessThan(2.8)
  await expect(
    page.getByText('E · Download crew dossier (CV / PDF)', { exact: true }),
  ).toBeVisible()
  const downloaded = page.waitForEvent('download')
  await page.keyboard.press('e')
  const file = await downloaded
  expect(await file.failure()).toBeNull()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('3 / 6 complete')
  await page.keyboard.press('Escape')
  await expect(hint).toBeVisible()
})

test('Space jumps once while held, lands and remains disabled in the focused tablet', async ({
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
  await focusTablet(page)
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Verify crew identity/ }).focus()
  await page.keyboard.press('Space')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toBeVisible()
  expect((await snapshot(page)).cameraPosition.y).toBeCloseTo(ground, 1)
})

test('restores lighting with E and persists optional guidance through skip, resume and replay', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const hud = page.getByRole('complementary', { name: 'Recovery objectives' })
  await expect(hud).toContainText('Restore interior lighting')
  const dimAmbient = (await snapshot(page)).cabinLighting.ambientIntensity
  expect(dimAmbient).not.toBeNull()
  await capture(page)
  await lookAt(page, { x: -1.4, y: 1.65, z: 6.1 })
  await expect(
    page.getByText('E · Restore lighting', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(hud).toContainText('Open mission tablet')
  await expect(hud).toContainText(
    'If you would rather skip the tutorial, go to the main computer.',
  )
  await expect(hud).toContainText('1 / 6 complete')
  await expect
    .poll(async () => (await snapshot(page)).cabinLighting.ambientIntensity)
    .toBeGreaterThan(dimAmbient!)
  await expect
    .poll(async () => (await snapshot(page)).cabinLighting.auxiliaryIntensity)
    .toBeCloseTo(65, 1)
  await expect
    .poll(async () => (await snapshot(page)).cabinLighting.alarmIntensity)
    .toBe(0)
  await focusTablet(page)
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toContainText('Mission guidance is optional')
  await expect(tablet).toContainText('2 / 6 objectives complete')
  await tablet
    .getByRole('button', { name: 'Continue Protocol', exact: true })
    .click()
  await focusTablet(page)
  await tablet
    .getByRole('button', { name: 'Skip Tutorial', exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await focusTablet(page)
  await expect(tablet).toContainText('2 / 6 objectives complete')
  await expect(
    tablet.getByRole('button', { name: /Restore interior lighting/ }),
  ).toHaveAttribute('data-complete', 'true')
  await tablet
    .getByRole('button', { name: 'Resume Protocol', exact: true })
    .click()
  await page.keyboard.press('t')
  await expect(hud).toContainText('Verify crew identity')
  await focusTablet(page)
  await tablet
    .getByRole('button', { name: 'Replay Protocol', exact: true })
    .click()
  await page.keyboard.press('t')
  await expect(hud).toContainText('Open mission tablet')
  await expect(hud).toContainText('1 / 6 complete')
  expect((await snapshot(page)).cabinLighting.auxiliaryIntensity).toBeCloseTo(
    65,
    1,
  )
  await focusTablet(page)
  await expect(
    tablet.getByRole('button', { name: /Restore interior lighting/ }),
  ).toHaveAttribute('data-complete', 'true')
  await expect(
    tablet.getByRole('button', { name: /Verify crew identity/ }),
  ).toHaveAttribute('data-complete', 'false')
  await page.setViewportSize({ width: 600, height: 800 })
  await expect(
    tablet.getByRole('button', { name: 'Close tablet' }),
  ).toBeVisible()
  const bounds = await tablet.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.width).toBeLessThanOrEqual(600)
})

test('cancels Crew Access before completion and retries with reduced motion', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await capture(page)
  await lookAt(page, { x: -1.4, y: 1.65, z: 6.1 })
  await expect(
    page.getByText('E · Restore lighting', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await lookAt(page, { x: -1.4, y: 1.65, z: 7.3 })
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  const standing = await snapshot(page)
  await page.keyboard.press('e')
  // Cancel through real input before the transition/scan can complete.
  await page.keyboard.press('Escape')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(identity).not.toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 6 complete')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  await focusTablet(page)
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(
    tablet.getByRole('button', { name: /Verify crew identity/ }),
  ).toHaveAttribute('data-complete', 'false')
  await tablet.getByRole('button', { name: 'Close tablet' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await capture(page)
  await lookAt(page, { x: -1.4, y: 1.65, z: 7.3 })
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  await page.keyboard.press('e')
  await expect(identity.getByRole('status')).toContainText('ACCESS GRANTED')
  await expect(identity.getByRole('heading', { name: /Master/ })).toBeVisible()
  const leave = identity.getByRole('button', { name: 'Leave terminal' })
  await expect(leave).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(leave).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('3 / 6 complete')
  expect((await snapshot(page)).pointerLocked).toBe(false)
})
