import { expect, test, type Page } from '@playwright/test'
import {
  enterObservationRoom,
  approachCrew,
  lookAt,
  walkTo,
} from './helpers/game'
import {
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_DEPTH,
} from '../src/game/world/arrivalRoomLayout'
import { EVA_EQUIPMENT_LAYOUT } from '../src/game/world/evaEquipmentLayout'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'
import gestureTiming from '../src/game/world/gestureTiming.json' with { type: 'json' }

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
const errors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120_000,
  })
  await expect
    .poll(() => page.evaluate(() => !!window.__GAME_DEBUG__))
    .toBe(true)
})
test.afterEach(async ({ page }, info) => {
  const collected = errors.get(page) ?? []
  await info.attach('browser-errors', {
    body: JSON.stringify(collected),
    contentType: 'application/json',
  })
  expect(collected).toEqual([])
})
async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}
test('tablet locates Crew Access and one scan reveals the compact identity record', async ({
  page,
}, info) => {
  test.setTimeout(120_000)
  const hiddenRendering = await snapshot(page)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  const tablet = page.getByRole('region', { name: 'Held mission tablet' })
  await expect(
    tablet.getByRole('listitem').filter({ hasText: 'Verify crew identity' }),
  ).toHaveAttribute('data-complete', 'false')
  await expect(tablet).toContainText('0 / 5')
  await expect(
    tablet.getByRole('img', {
      name: /Crew Access in the docking arrival room/,
    }),
  ).toBeVisible()
  await expect(tablet.locator('..')).toHaveCSS('opacity', '1')
  const tabletBounds = await tablet.boundingBox()
  expect(tabletBounds).not.toBeNull()
  expect(tabletBounds!.x).toBeGreaterThanOrEqual(0)
  expect(tabletBounds!.x + tabletBounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
  await page.screenshot({ path: info.outputPath('blender-tablet-held.png') })
  const heldRendering = await snapshot(page)
  await info.attach('hand-model-render-cost', {
    body: JSON.stringify({
      hidden: {
        drawCalls: hiddenRendering.drawCalls,
        triangles: hiddenRendering.triangles,
      },
      held: {
        drawCalls: heldRendering.drawCalls,
        triangles: heldRendering.triangles,
      },
      note: 'Single rendered frames at the same camera; not a frame-rate benchmark.',
    }),
    contentType: 'application/json',
  })
  const desktopViewport = page.viewportSize()!
  await page.setViewportSize({ width: 430, height: 860 })
  await expect
    .poll(async () => {
      const bounds = await tablet.boundingBox()
      return !!bounds && bounds.x >= 0 && bounds.x + bounds.width <= 430
    })
    .toBe(true)
  await page.screenshot({
    path: info.outputPath('blender-tablet-portrait.png'),
  })
  await page.setViewportSize(desktopViewport)
  await page.keyboard.press('t')
  await expect
    .poll(async () =>
      Number(
        await tablet
          .locator('..')
          .evaluate((el) => getComputedStyle(el).opacity),
      ),
    )
    .toBeLessThan(1)
  await page.keyboard.press('t')
  await expect(tablet.locator('..')).toHaveCSS('opacity', '1')
  await page.keyboard.press('t')
  await expect(tablet).not.toBeVisible()
  await approachCrew(page)
  await expect(page.locator('.interaction-hint')).toContainText('Crew Access')
  await page.screenshot({ path: info.outputPath('crew-access-highlight.png') })
  const standing = await snapshot(page)
  const gestureSamples = page.evaluate(
    () =>
      new Promise<
        {
          elapsed: number
          gap: number | null
          phase: string
          committed: boolean
        }[]
      >((resolve, reject) => {
        const samples: {
          elapsed: number
          gap: number | null
          phase: string
          committed: boolean
        }[] = []
        const timeout = window.setTimeout(
          () => reject(new Error('Crew gesture never completed')),
          15000,
        )
        const sample = () => {
          const state = window.__GAME_DEBUG__?.snapshot()
          if (state?.crewGesture?.elapsedSeconds != null)
            samples.push({
              elapsed: state.crewGesture.elapsedSeconds,
              gap: state.crewGesture.cardReaderGap,
              phase: state.session.identity,
              committed: state.crewGesture.actionCommitted,
            })
          if (state?.session.identity === 'verified') {
            clearTimeout(timeout)
            resolve(samples)
          } else requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }),
  )
  const contactImage = page
    .waitForFunction((contact) => {
      const gesture = window.__GAME_DEBUG__?.snapshot().crewGesture
      return (
        gesture?.elapsedSeconds != null && gesture.elapsedSeconds >= contact
      )
    }, gestureTiming.card.contact)
    .then(() =>
      page.screenshot({ path: info.outputPath('card-reader-contact.png') }),
    )
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(identity).toBeVisible()
  const panel = identity.locator('.crew-identity')
  const status = panel.getByRole('status')
  await expect(status).toContainText('Verifying credentials')
  const scanningBounds = await panel.boundingBox()
  const scanningStatus = await status.boundingBox()
  const started = Date.now()
  await expect(status).toContainText('ACCESS GRANTED', { timeout: 3000 })
  const contactSamples = await gestureSamples
  await contactImage
  expect(
    contactSamples.some(
      (s) =>
        !s.committed &&
        s.gap !== null &&
        s.gap < 0.002 &&
        s.elapsed >= gestureTiming.card.contact &&
        s.elapsed < gestureTiming.card.action,
    ),
    JSON.stringify(contactSamples),
  ).toBe(true)
  const scanning = contactSamples.find((s) => s.committed)
  expect(scanning).toBeDefined()
  expect(scanning!.elapsed).toBeGreaterThanOrEqual(gestureTiming.card.action)
  expect(scanning!.gap).not.toBeNull()
  expect(scanning!.gap!, JSON.stringify(contactSamples)).toBeLessThan(0.002)
  expect(Date.now() - started).toBeLessThan(3000)
  const grantedBounds = await panel.boundingBox()
  const grantedStatus = await status.boundingBox()
  expect(scanningBounds).not.toBeNull()
  expect(scanningStatus).not.toBeNull()
  expect(grantedBounds).not.toBeNull()
  expect(grantedStatus).not.toBeNull()
  for (const dimension of ['x', 'y', 'width', 'height'] as const) {
    expect(
      Math.abs(scanningBounds![dimension] - grantedBounds![dimension]),
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(scanningStatus![dimension] - grantedStatus![dimension]),
    ).toBeLessThanOrEqual(1)
  }
  await page.screenshot({ path: info.outputPath('crew-access-granted.png') })
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await expect(
    identity.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  await expect(identity.getByRole('heading', { name: /Master/ })).toBeVisible()
  const portrait = identity.getByRole('img', { name: 'Joaquín Pettinari' })
  await expect(portrait).toHaveCount(1)
  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveAttribute('src', '/images/crew-portrait.webp')
  await expect(
    identity.getByRole('button', { name: 'Training record' }),
  ).toHaveCount(0)
  expect((await snapshot(page)).pointerLocked).toBe(false)
  await identity.getByRole('button', { name: 'Leave terminal' }).click()
  await expect(identity).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.x)
    .toBeCloseTo(standing.cameraPosition.x, 1)
  await walkTo(page, -0.8, 16)
  await lookAt(page, {
    x: EVA_EQUIPMENT_LAYOUT.position[0],
    y: 1.75,
    z:
      ARRIVAL_ORIGIN_Z +
      ARRIVAL_DEPTH -
      0.04 +
      EVA_EQUIPMENT_LAYOUT.position[2],
  })
  await page.screenshot({ path: info.outputPath('hanging-suit.png') })
  await enterObservationRoom(page)
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('1 / 5 complete')
})
