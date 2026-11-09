import { expect, test, type Page } from '@playwright/test'
import {
  enter,
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

test('powered bulkhead visibly slides with collision and stays open for a return crossing', async ({
  page,
}, info) => {
  await ready(page)
  await enter(page)
  await lookAt(page, { x: 0, y: 1.65, z: 5.12 })
  await expect(
    page.getByText('Restore auxiliary power first', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('closed')
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(5.65)
    await page.waitForTimeout(400)
    expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(5.44)
  } finally {
    await page.keyboard.up('w')
  }
  expect((await protocol(page)).completed).toEqual([])
  await lookAt(page, { x: -1.4, y: 1.65, z: 6.1 })
  await expect(
    page.getByText('E · Restore lighting', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await protocol(page)).completed)
    .toEqual(['lighting'])
  await lookAt(page, { x: 0, y: 1.65, z: 5.12 })
  await expect(
    page.getByText('E · Open bulkhead', { exact: true }),
  ).toBeVisible()

  // Read-only frame observations record the visual leaf transforms and player.
  // All motion, power and opening below comes from actual keyboard input.
  const recording = page.evaluate(async () => {
    const samples = []
    const deadline = performance.now() + 20000
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
      if (
        state.session.bulkheadPhase === 'open' &&
        state.cameraPosition.z < 4.2
      )
        break
    } while (performance.now() < deadline)
    return samples
  })
  let samples: Awaited<typeof recording>
  await page.keyboard.down('w')
  try {
    await page.keyboard.press('e')
    await expect
      .poll(async () => (await snapshot(page)).session.bulkheadPhase)
      .toBe('open')
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(3.55)
  } finally {
    await page.keyboard.up('w')
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
      const gap = sample.leaves.right.x - sample.leaves.left.x - 1.25
      return sample.phase === 'opening' && gap > 0.1 && gap < 2.5
    }),
  ).toBe(true)
  for (const sample of samples) {
    expect(sample.leaves.left).not.toBeNull()
    expect(sample.leaves.right).not.toBeNull()
    const gap = sample.leaves.right!.x - sample.leaves.left!.x - 1.25
    if (sample.phase === 'closed' || sample.phase === 'unlocking') {
      expect(gap).toBeLessThan(0.04)
      expect(sample.playerZ).toBeGreaterThan(5.44)
    }
    if (gap < 0.4) expect(sample.playerZ).toBeGreaterThan(5.12)
  }
  const open = await snapshot(page)
  expect(open.bulkheadLeaves.left!.x).toBeLessThan(-1.8)
  expect(open.bulkheadLeaves.right!.x).toBeGreaterThan(1.8)
  await walkTo(page, 0, 6.8)
  await lookAt(page, { x: 0, y: 1.65, z: 5.12 })
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
  expect(state.bulkheadLeaves.left!.x).toBeLessThan(-1.8)
  expect(state.bulkheadLeaves.right!.x).toBeGreaterThan(1.8)
  expect(state.cameraPosition.z).toBeLessThan(3.55)
  await walkTo(page, 0, 6.8)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
})
