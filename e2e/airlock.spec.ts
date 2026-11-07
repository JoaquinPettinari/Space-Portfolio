import { expect, test, type Page } from '@playwright/test'
import { enter, lookAt, protocol, snapshot } from './helpers/game'

const errors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('fresh arrival restores power, opens bulkhead and crosses the seam both ways without falling', async ({
  page,
}, info) => {
  test.setTimeout(120_000)
  const start = await snapshot(page)
  expect(start.cameraPosition.z).toBeCloseTo(7, 1)
  expect(start.pointerLocked).toBe(false)
  expect((await protocol(page)).completed).toEqual([])
  await page.screenshot({ path: 'artifacts/airlock-arrival.png' })
  await enter(page)
  await lookAt(page, { x: 0, y: 1.65, z: 4.86 })
  await expect(
    page.getByText('Restore auxiliary power first', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await page.keyboard.down('w')
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.z)
    .toBeLessThan(5.6)
  await page.waitForTimeout(300)
  await page.keyboard.up('w')
  expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(5.25)
  expect((await protocol(page)).completed).toEqual([])
  await lookAt(page, { x: -1.4, y: 1.65, z: 6.1 })
  await expect(
    page.getByText('E · Restore lighting', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await protocol(page)).completed)
    .toEqual(['lighting'])
  await lookAt(page, { x: 0, y: 1.65, z: 4.86 })
  await expect(
    page.getByText('E · Open bulkhead', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(
    page.getByText('E · Open bulkhead', { exact: true }),
  ).not.toBeVisible()
  const heights: number[] = []
  const cross = async (z: number, direction: 'forward' | 'back') => {
    await lookAt(page, { x: 0, y: (await snapshot(page)).cameraPosition.y, z })
    await page.keyboard.down('w')
    try {
      await expect
        .poll(
          async () => {
            const p = (await snapshot(page)).cameraPosition
            heights.push(p.y)
            return direction === 'forward' ? p.z < 3.5 : p.z > 6.5
          },
          { intervals: [30, 50] },
        )
        .toBe(true)
    } finally {
      await page.keyboard.up('w')
    }
  }
  await cross(0, 'forward')
  await page.screenshot({ path: 'artifacts/airlock-room-reveal.png' })
  await cross(8, 'back')
  await page.keyboard.press('t')
  await page
    .getByRole('button', { name: 'Replay Protocol', exact: true })
    .click()
  await expect
    .poll(async () => (await protocol(page)).completed)
    .toEqual(['lighting'])
  await cross(0, 'forward')
  expect(Math.min(...heights)).toBeGreaterThan(1.55)
  expect(Math.max(...heights)).toBeLessThan(1.85)
  await info.attach('door-crossing-eye-heights', {
    body: JSON.stringify(heights),
    contentType: 'application/json',
  })
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await enter(page)
  // Persisted power restores an open route; no second interaction is necessary.
  await cross(0, 'forward')
  expect((await protocol(page)).completed).toEqual(['lighting'])
})
