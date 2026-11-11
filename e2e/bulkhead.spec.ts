import { expect, test, type Page } from '@playwright/test'
import {
  enterEntryModule,
  approachCrew,
  restoreEntryPower,
  enterObservationRoom,
  lookAt,
  protocol,
  snapshot,
  walkTo,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
test.setTimeout(180_000)

const errors = new WeakMap<Page, string[]>()
test.beforeEach(({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
})
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([])
})

async function ready(page: Page) {
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
}

test('credential-controlled bulkhead visibly slides with collision and stays open for a return crossing', async ({
  page,
}, info) => {
  await ready(page)
  await enterEntryModule(page)
  await walkTo(page, 0, 13.3)
  await lookAt(page, { x: 0, y: 1.65, z: 11.65 })
  await expect(
    page.getByText('Use Crew Access to open the bulkhead', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('closed')
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(12.3)
    await page.waitForTimeout(400)
    expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(12.15)
  } finally {
    await page.keyboard.up('w')
  }
  expect((await protocol(page)).completed).toEqual(['lighting'])
  await restoreEntryPower(page)
  await walkTo(page, 0, 13.3)
  await approachCrew(page)
  const returnPosition = (await snapshot(page)).cameraPosition

  // Read-only frame observations record the visual leaf transforms and player.
  // All motion, credential verification and opening below comes from actual keyboard input.
  const recording = page.evaluate(async () => {
    const samples = []
    const deadline = performance.now() + 60000
    do {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      const state = window.__GAME_DEBUG__!.snapshot()
      samples.push({
        phase: state.session.bulkheadPhase,
        leaves: state.bulkheadLeaves,
        playerZ: state.cameraPosition.z,
      })
      if (state.session.bulkheadPhase === 'open') break
    } while (performance.now() < deadline)
    return samples
  })
  let samples: Awaited<typeof recording>
  try {
    await page.keyboard.press('e')
    await expect(
      page
        .getByRole('dialog', { name: 'Crew Access' })
        .locator('.crew-identity')
        .getByRole('status'),
    ).toContainText('ACCESS GRANTED')
    await expect
      .poll(async () => (await snapshot(page)).session.bulkheadPhase, {
        timeout: 30000,
      })
      .toBe('open')
    await page
      .getByRole('dialog', { name: 'Crew Access' })
      .getByRole('button', { name: 'Leave terminal' })
      .click()
    await expect
      .poll(async () => (await snapshot(page)).pointerLocked)
      .toBe(true)
    await expect
      .poll(async () => {
        const p = (await snapshot(page)).cameraPosition
        return Math.hypot(
          p.x - returnPosition.x,
          p.y - returnPosition.y,
          p.z - returnPosition.z,
        )
      })
      .toBeLessThan(0.01)
    await expect(page.locator('.interaction-hint')).toContainText('Crew Access')
    await walkTo(page, 0, 13.3)
    await walkTo(page, 0, 3.5)
  } finally {
    samples = await recording
  }
  await info.attach('bulkhead-motion-and-collision', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  })
  expect(samples.some((sample) => sample.phase === 'unlocking')).toBe(true)
  expect(samples.some((sample) => sample.phase === 'opening')).toBe(true)
  expect(samples.some((sample) => sample.phase === 'open')).toBe(true)
  expect(
    samples.some((sample) => {
      if (!sample.leaves.left || !sample.leaves.right) return false
      const gap = sample.leaves.right.x - sample.leaves.left.x - 1.38
      return sample.phase === 'opening' && gap > 0.1 && gap < 2.5
    }),
  ).toBe(true)
  for (const sample of samples) {
    expect(sample.leaves.left).not.toBeNull()
    expect(sample.leaves.right).not.toBeNull()
    const gap = sample.leaves.right!.x - sample.leaves.left!.x - 1.38
    if (sample.phase === 'closed' || sample.phase === 'unlocking') {
      expect(gap).toBeLessThan(0.04)
      expect(sample.playerZ).toBeGreaterThan(12.15)
    }
    if (gap < 0.4) expect(sample.playerZ).toBeGreaterThan(11.77)
  }
  const open = await snapshot(page)
  expect(open.bulkheadLeaves.left!.x).toBeLessThan(-2.0)
  expect(open.bulkheadLeaves.right!.x).toBeGreaterThan(2.0)
  await walkTo(page, 0, 13.4)
  await lookAt(page, { x: 0, y: 1.65, z: 11.65 })
  await page.keyboard.press('e')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await walkTo(page, 0, 3.5)
  expect((await snapshot(page)).pointerLocked).toBe(true)
})

test('reduced motion preserves the fully open passage and permanent open state', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  await enterObservationRoom(page)
  const state = await snapshot(page)
  expect(state.session.bulkheadPhase).toBe('open')
  expect(state.bulkheadLeaves.left!.x).toBeLessThan(-2.0)
  expect(state.bulkheadLeaves.right!.x).toBeGreaterThan(2.0)
  expect(state.cameraPosition.z).toBeLessThan(3.55)
  await walkTo(page, 0, 13.4)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
})
