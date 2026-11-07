import { expect, test, type Page } from '@playwright/test'
import { enter, enterObservationRoom, snapshot } from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
test.setTimeout(180_000)

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
  ).toBeVisible({ timeout: 60000 })
})
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([])
})

test('arrival expires and reopening the held tablet does not repeat its subtitle', async ({
  page,
}) => {
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'arrival')
  await expect(subtitle).not.toBeVisible({ timeout: 20000 })
  await enter(page)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'tablet', {
    timeout: 20000,
  })
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await expect(subtitle).not.toBeVisible({ timeout: 20000 })
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).not.toBeVisible()
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  // Observe several frames after the second real input, not just the key event.
  await page.waitForTimeout(500)
  await expect(subtitle).not.toBeVisible()
  expect((await snapshot(page)).session.protocol.completed).toEqual(['tablet'])
})

test('real power and bulkhead interactions advance entry dialogue without stacked subtitles', async ({
  page,
}) => {
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'arrival')
  await enterObservationRoom(page)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  // Short entry states replace stale entry guidance. The final open event must
  // be readable, without requiring the browser to render every 350ms state.
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'open', {
    timeout: 20000,
  })
  await expect(subtitle).toHaveCount(1)
  await expect(subtitle).not.toBeVisible({ timeout: 30000 })
  expect((await snapshot(page)).pointerLocked).toBe(true)
})
