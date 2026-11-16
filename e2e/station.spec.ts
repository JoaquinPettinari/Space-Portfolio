import { COMMAND_POSES } from '../src/game/world/commandLayout'
import { BRIDGE_OUTLINE } from '../src/game/world/bridgeLayout'
import { ENTRY_DOCKING_DEPTH } from '../src/game/world/entryLayout'
import { PLAYER_CAPSULE_RADIUS } from '../src/game/player/jump'
import { BRIDGE_OFFSET_Z } from '../src/game/world/bridgePlacement'
import { expect, test, type Page } from '@playwright/test'
import {
  enter as capture,
  enterObservationRoom,
  forwardStation,
  approachCrew,
  walkTo,
  lookAt,
  snapshot,
} from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

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
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 45_000,
  })
  await expect
    .poll(() => page.evaluate(() => !!window.__GAME_DEBUG__))
    .toBe(true)
})

test.setTimeout(90_000)

const collectors = new WeakMap<Page, string[]>()

test('toggles ambient sound without capturing the mouse', async ({ page }) => {
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  await expect(pause).not.toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await page.keyboard.press('Escape')
  await expect(pause).toBeVisible()
  const sound = pause.getByRole('switch', { name: 'Ambient sound' })
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'true')
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'false')
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
  if ((await snapshot(page)).cameraPosition.z < 4.5 + BRIDGE_OFFSET_Z) {
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
  const controls = page.getByLabel('Game controls')
  await expect(controls).toContainText('Move')
  await expect(controls).toContainText('Look')
  await expect(controls).toContainText('Interact')
  await expect(controls.locator('.hud-wasd kbd')).toHaveText([
    'W',
    'A',
    'S',
    'D',
  ])
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
    page.getByRole('button', { name: 'Resume mission' }),
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
  const pose = COMMAND_POSES.computer
  const chair = { x: pose.chair[0], z: pose.chair[2] + BRIDGE_OFFSET_Z }
  const normal = { x: Math.sin(pose.rotation), z: Math.cos(pose.rotation) }
  // Approach the rear face along the rotated chair's actual normal, rather
  // than following the old x=-2.4 aisle past its moved seat.
  await walkTo(page, -2.4, 3.1 + BRIDGE_OFFSET_Z)
  await walkTo(page, -2.4, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, chair.x + normal.x * 2.2, chair.z + normal.z * 2.2)
  await lookAt(page, { x: chair.x, y: 1.7, z: chair.z })
  const normalDistance = (p: GameSnapshot['cameraPosition']) =>
    (p.x - chair.x) * normal.x + (p.z - chair.z) * normal.z
  const start = (await snapshot(page)).cameraPosition
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => normalDistance((await snapshot(page)).cameraPosition))
      .toBeLessThan(normalDistance(start) - 0.5)
  } finally {
    await page.keyboard.up('w')
  }
  await page.waitForTimeout(100)
  const openFloorStop = (await snapshot(page)).cameraPosition
  await page.waitForTimeout(300)
  const afterStop = (await snapshot(page)).cameraPosition
  expect(
    Math.hypot(afterStop.x - openFloorStop.x, afterStop.z - openFloorStop.z),
  ).toBeLessThan(0.02)

  // CommandChair is a 0.42m half-width box; capsule contact is 0.3m farther out.
  const contactDistance = 0.42 + PLAYER_CAPSULE_RADIUS
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => normalDistance((await snapshot(page)).cameraPosition))
      .toBeLessThan(contactDistance + 0.1)
    await page.waitForTimeout(300)
    const contact = (await snapshot(page)).cameraPosition
    expect(normalDistance(contact)).toBeGreaterThan(contactDistance - 0.1)
    expect(contact.y).toBeGreaterThan(1.6)
  } finally {
    await page.keyboard.up('w')
  }
  await page.waitForTimeout(100)
  const stopped = (await snapshot(page)).cameraPosition
  await page.waitForTimeout(300)
  const final = (await snapshot(page)).cameraPosition
  expect(Math.hypot(final.x - stopped.x, final.z - stopped.z)).toBeLessThan(
    0.02,
  )
})

test('opens the computer directly and returns to walking', async ({ page }) => {
  test.setTimeout(120_000)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const verifyProjectImages = async () => {
    const media = page.locator('.archive-record-media')
    const choices = media.getByRole('button', { name: /^Image \d+:/ })
    const count = await choices.count()
    expect(count).toBeGreaterThan(0)
    for (let index = 0; index < count; index++) {
      const choice = choices.nth(index)
      await choice.click()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      const image = media.getByRole('img')
      await expect(image).toHaveCount(1)
      await expect(image).toBeInViewport()
      await expect
        .poll(() =>
          image.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0)
      await expect(image).not.toHaveAttribute('alt', '')
    }
  }
  await enter(page)
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await forwardStation(page, -1)
  await page.waitForTimeout(200)
  const standing = await snapshot(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Sit down' }),
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
  await expect(
    page.getByRole('button', { name: 'Contact', exact: true }),
  ).toHaveCount(0)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).not.toBeVisible()
  await page.waitForTimeout(1200)
  await enter(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Exit computer' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Resume mission' }),
  ).not.toBeVisible()
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
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
  // Free aft lane is behind the continuous console's end.
  await walkTo(page, 2.4, 4.5 + BRIDGE_OFFSET_Z)
  await lookAt(page, { x: 2.4, y: 1.7, z: -4 + BRIDGE_OFFSET_Z })
  const initialX = (await snapshot(page)).cameraPosition.x
  await page.keyboard.down('d')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(initialX + 0.3)
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
  const sideContact = BRIDGE_OUTLINE[6][0] - 0.1 - PLAYER_CAPSULE_RADIUS
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeGreaterThan(sideContact - 0.15)
  await page.waitForTimeout(300)
  expect((await snapshot(page)).cameraPosition.x).toBeLessThan(
    sideContact + 0.15,
  )
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
    .toBe(before.orbit)
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
  expect((await snapshot(page)).spaceMotion.orbit).toBe(before.orbit)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(150)
  const still = (await snapshot(page)).spaceMotion
  await page.waitForTimeout(300)
  expect((await snapshot(page)).spaceMotion).toEqual(still)
  // Start at the actual arrival module rather than the former rear-room coordinates.
  await capture(page)
  await lookAt(page, { x: 0, y: 1.7, z: 0 })
  const rearContact = ENTRY_DOCKING_DEPTH - 0.17 - PLAYER_CAPSULE_RADIUS
  await page.keyboard.down('s')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeGreaterThan(rearContact - 0.15)
    await page.waitForTimeout(300)
    const blocked = (await snapshot(page)).cameraPosition
    expect(blocked.z).toBeLessThan(rearContact + 0.15)
    expect(blocked.y).toBeGreaterThan(1.6)
  } finally {
    await page.keyboard.up('s')
  }
})

test('rear hull corner blocks diagonal walking without leaving the floor', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enter(page)
  await walkTo(page, 3.2, 4.35 + BRIDGE_OFFSET_Z)
  // Aim diagonally at the corner itself; fixed mouse deltas depended on an old pose.
  await lookAt(page, { x: 7, y: 1.7, z: 7 + BRIDGE_OFFSET_Z })
  const sideContact = BRIDGE_OUTLINE[6][0] - 0.1 - PLAYER_CAPSULE_RADIUS
  const rearContact =
    BRIDGE_OUTLINE[0][1] + BRIDGE_OFFSET_Z - 0.15 - PLAYER_CAPSULE_RADIUS
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.x)
      .toBeGreaterThan(sideContact - 0.15)
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeGreaterThan(rearContact - 0.15)
    await page.waitForTimeout(300)
    const corner = (await snapshot(page)).cameraPosition
    expect(corner.x).toBeLessThan(sideContact + 0.15)
    expect(corner.z).toBeLessThan(rearContact + 0.15)
    expect(corner.y).toBeGreaterThan(1.6)
    await page.waitForTimeout(300)
    const stopped = (await snapshot(page)).cameraPosition
    expect(Math.hypot(stopped.x - corner.x, stopped.z - corner.z)).toBeLessThan(
      0.06,
    )
  } finally {
    await page.keyboard.up('w')
  }
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
    page.getByRole('button', { name: 'Resume mission' }),
  ).not.toBeVisible()
})

test('rear alcove is decorative without a wall CV interaction', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await enterObservationRoom(page)
  await walkTo(page, -2.2, 0.5)
  await lookAt(page, { x: -3.25, y: 1.65, z: 1.62 })
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: 'Download crew dossier (CV / PDF)' }),
  ).not.toBeVisible()
  expect((await snapshot(page)).pointerLocked).toBe(true)
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

test('starts powered and keeps optional guidance within a session and resets it on refresh', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const hud = page.getByRole('complementary', { name: 'Recovery objectives' })
  await expect(hud).toContainText('Verify crew identity')
  const lighting = (await snapshot(page)).cabinLighting
  expect(lighting.ambientIntensity).toBeGreaterThan(0)
  expect(lighting.auxiliaryIntensity).toBeCloseTo(65, 1)
  expect(lighting.alarmIntensity).toBe(0)
  expect((await snapshot(page)).session.protocol.completed).toEqual([
    'lighting',
  ])
  await capture(page)
  await expect(hud).toContainText('0 / 4 complete')
  await focusTablet(page)
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(tablet).toContainText('Mission guidance is optional')
  await expect(tablet).toContainText('0 / 4 objectives complete')
  await tablet
    .getByRole('button', { name: 'Continue Protocol', exact: true })
    .click()
  await focusTablet(page)
  await tablet
    .getByRole('button', { name: 'Skip Tutorial', exact: true })
    .click()
  await focusTablet(page)
  await expect(tablet).toContainText('0 / 4 objectives complete')
  await expect(
    tablet.getByRole('button', { name: /Restore interior lighting/ }),
  ).toHaveCount(0)
  await tablet
    .getByRole('button', { name: 'Resume Protocol', exact: true })
    .click()
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).not.toBeVisible()
  await expect(hud).toContainText('Verify crew identity')
  await focusTablet(page)
  await tablet
    .getByRole('button', { name: 'Replay Protocol', exact: true })
    .click()
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).not.toBeVisible()
  await expect(hud).toContainText('Verify crew identity')
  await expect(hud).toContainText('0 / 4 complete')
  expect((await snapshot(page)).cabinLighting.auxiliaryIntensity).toBeCloseTo(
    65,
    1,
  )
  await focusTablet(page)
  await expect(
    tablet.getByRole('button', { name: /Restore interior lighting/ }),
  ).toHaveCount(0)
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
  await page.reload()
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 45000 })
  await expect(hud).toContainText('0 / 4 complete')
  await expect(hud).toContainText('Verify crew identity')
  expect((await snapshot(page)).session.protocol.guidance).toBe('pending')
})

test('cancels Crew Access before completion and retries with reduced motion', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await approachCrew(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
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
  ).toContainText('0 / 4 complete')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  // Wait for the cancelled camera transition to finish before sending T/R.
  await expect(page.locator('.crosshair')).toBeVisible()
  await focusTablet(page)
  const tablet = page.getByRole('dialog', { name: 'Mission tablet' })
  await expect(
    tablet.getByRole('button', { name: /Verify crew identity/ }),
  ).toHaveAttribute('data-complete', 'false')
  await tablet.getByRole('button', { name: 'Close tablet' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await capture(page)
  await approachCrew(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expect(identity.getByRole('heading', { name: /Master/ })).toBeVisible()
  const leave = identity.getByRole('button', { name: 'Leave terminal' })
  await expect(leave).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(leave).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 4 complete')
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(page.locator('.crosshair')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
})
