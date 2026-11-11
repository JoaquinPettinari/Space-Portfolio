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
    page.getByRole('complementary', { name: 'Recovery objectives' }),
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

test('pause has only essential controls and HUD tracks tablet progress', async ({
  page,
}) => {
  await enter(page)
  await page.keyboard.press('Escape')
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  await expect(pause).toBeVisible()
  await expect(pause.getByRole('button')).toHaveCount(1)
  await expect(pause.getByRole('switch')).toHaveCount(2)
  const subtitles = pause.getByRole('switch', {
    name: 'Subtitles',
    exact: true,
  })
  const soundBounds = await pause
    .getByRole('switch', { name: 'Ambient sound', exact: true })
    .boundingBox()
  const subtitleBounds = await subtitles.boundingBox()
  expect(soundBounds).not.toBeNull()
  expect(subtitleBounds).not.toBeNull()
  expect(Math.abs(soundBounds!.width - subtitleBounds!.width)).toBeLessThan(1)
  expect(Math.abs(soundBounds!.x - subtitleBounds!.x)).toBeLessThan(1)
  await subtitles.click()
  await expect(subtitles).toHaveAttribute('aria-checked', 'false')
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveCount(0)
  await subtitles.click()
  await page.keyboard.press('Escape')
  await expect(pause).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await page.keyboard.press('t')
  await page.keyboard.press('t')
  const item = page
    .getByRole('complementary', { name: 'Recovery objectives' })
    .getByRole('listitem')
    .filter({ hasText: 'Open mission tablet' })
  await expect(item).toHaveAttribute('data-complete', 'true')
  await expect(item.locator('s')).toHaveText('Open mission tablet')
  await page.keyboard.press('Escape')
  await expect(pause).toBeVisible()
  await page.keyboard.press('t')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  const archive = page.getByRole('dialog', { name: 'Central Archive' })
  await expect(archive).toBeVisible()
  await archive
    .getByRole('button', { name: 'Service Record', exact: true })
    .click()
  const caption = page.getByRole('status', { name: 'Station assistant' })
  await expect(caption).toHaveAttribute('data-dialogue-event', 'archives', {
    timeout: 30000,
  })
  await expect(archive.locator('.station-assistant')).toHaveCount(0)
  const captionBox = await caption.boundingBox()
  const viewport = page.viewportSize()!
  expect(captionBox).not.toBeNull()
  const monitorBox = await archive.boundingBox()
  expect(monitorBox).not.toBeNull()
  expect(captionBox!.y).toBeGreaterThanOrEqual(
    monitorBox!.y + monitorBox!.height,
  )
  expect(captionBox!.y).toBeGreaterThan(viewport.height * 0.85)
  expect(
    Math.abs(captionBox!.x + captionBox!.width / 2 - viewport.width / 2),
  ).toBeLessThan(2)
  await archive.getByRole('button', { name: 'Exit computer' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(
    page
      .getByRole('complementary', { name: 'Recovery objectives' })
      .getByRole('listitem')
      .filter({ hasText: 'Review expedition archives' }),
  ).toHaveAttribute('data-complete', 'true')
})

test('computer exits never open pause or show a cursor recovery notice', async ({
  page,
}) => {
  await enter(page)
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  for (const exit of ['button', 'KeyE', 'Escape']) {
    // The return camera animation takes 650ms; shortcuts are intentionally guarded during it.
    await page.waitForTimeout(1000)
    await page.keyboard.press('t')
    await expect(
      page.getByRole('region', { name: 'Held mission tablet' }),
    ).toBeVisible()
    await page.keyboard.press('r')
    await expect(
      page.getByRole('dialog', { name: 'Mission tablet', exact: true }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
      .click()
    const archive = page.getByRole('dialog', { name: 'Central Archive' })
    await expect(archive).toBeVisible()
    if (exit === 'button')
      await archive.getByRole('button', { name: 'Exit computer' }).click()
    else await page.keyboard.press(exit === 'KeyE' ? 'e' : 'Escape')
    await expect(archive).not.toBeVisible()
    await expect(pause).not.toBeVisible()
    await expect
      .poll(async () => (await snapshot(page)).pointerLocked)
      .toBe(true)
    await expect(
      page.getByText('Mouse control is unavailable.', { exact: false }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Resume mouse control' }),
    ).toHaveCount(0)
  }
})
