import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom, forwardStation } from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

const errors = new WeakMap<Page, string[]>()
async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}
test.beforeEach(({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    // The deliberate HTTP 503 below is expected; all other browser errors fail.
    if (
      message.type() === 'error' &&
      !(
        message.location().url.endsWith('/api/contact') &&
        message.text().includes('503')
      )
    )
      collected.push(message.text())
  })
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('walks to independent communications, skips without sending and resumes controls', async ({
  page,
}, info) => {
  test.setTimeout(120_000)
  let requests = 0
  await page.route('**/api/contact', (route) => {
    requests++
    return route.fulfill({ status: 500, json: { error: 'Unexpected send' } })
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await enterObservationRoom(page)
  const samples: GameSnapshot[] = []
  for (let i = 0; i < 15; i++) {
    samples.push(await snapshot(page))
    await page.waitForTimeout(50)
  }
  await info.attach('scene-observations', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  })
  await forwardStation(page, 1)
  await page.keyboard.press('e')
  const terminal = page.getByRole('dialog', {
    name: 'Earth Communications',
    exact: true,
  })
  await expect(terminal).toBeVisible()
  await expect(
    terminal.getByRole('heading', {
      name: 'Earth Communications',
      exact: true,
    }),
  ).toBeInViewport()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  await expect(
    terminal.getByText(
      /Messages welcome in Spanish, English, Italian and Norwegian/,
    ),
  ).toBeInViewport()
  await terminal.getByRole('button', { name: 'Skip', exact: true }).click()
  await expect(terminal.getByRole('form').getByRole('status')).toContainText(
    'No message was sent',
  )
  await expect(terminal.getByRole('form').getByRole('status')).toBeFocused()
  expect(requests).toBe(0)
  await expect
    .poll(async () => (await snapshot(page)).session.protocol.completed)
    .toContain('uplink')
  await page.keyboard.press('e')
  await expect(terminal).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(
    page.getByText('E · Earth Communications', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(terminal).toBeVisible()
  await terminal
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Terje')
  await page.keyboard.press('e')
  await expect(terminal).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(terminal).not.toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  expect(requests).toBe(0)
})

test('quick portfolio contact preserves failed draft and confirms only accepted retry', async ({
  page,
}) => {
  let attempts = 0
  await page.route('**/api/contact', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toMatchObject({
      name: 'Test Visitor',
      email: 'visitor@example.com',
      message: 'A test transmission only.',
    })
    attempts++
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { error: 'Unavailable' } }
        : { status: 200, json: { accepted: true } },
    )
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Mission tablet · T' })
    .click({ timeout: 45_000 })
  await page
    .getByRole('button', { name: 'Quick Portfolio Access', exact: true })
    .click()
  await page.getByRole('button', { name: 'Contact', exact: true }).click()
  const form = page.getByRole('form', { name: 'Earth Communications' })
  await form
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Test Visitor')
  await form
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('visitor@example.com')
  await form
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('A test transmission only.')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('alert')).toContainText(
    'Transmission was not confirmed',
  )
  await expect(
    form.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveValue('A test transmission only.')
  await expect(form.getByRole('status')).not.toContainText('accepted')
  await form.getByRole('button', { name: 'Send Transmission' }).click()
  await expect(form.getByRole('status')).toContainText(
    'Transmission accepted by the email provider',
  )
  await expect(form.getByRole('status')).toBeFocused()
  await expect(
    form.getByRole('button', { name: 'Send Transmission' }),
  ).toBeDisabled()
  expect(attempts).toBe(2)
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  )
})
