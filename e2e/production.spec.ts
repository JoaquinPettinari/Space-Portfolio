import { expect, test } from '@playwright/test'
import type {} from '../src/game/debug/GameDiagnostics'
import { readSecurityHeaders } from '../server/securityHeaders'

test('starts directly in the production station and keeps portfolio access secondary', async ({
  page,
}) => {
  const errors: string[] = []
  const violations: string[] = []
  await page.exposeFunction('reportCspViolation', (directive: string) => {
    violations.push(directive)
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const reportingWindow = window as unknown as {
        reportCspViolation: (directive: string) => Promise<void>
      }
      void reportingWindow.reportCspViolation(event.effectiveDirective)
    })
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const response = await page.goto('/')
  expect(response).not.toBeNull()
  for (const [name, value] of Object.entries(readSecurityHeaders())) {
    expect(await response!.headerValue(name)).toBe(value)
  }
  await expect(page.locator('canvas')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeEnabled({ timeout: 15_000 })
  await expect(
    page.getByRole('button', { name: 'Enter station', exact: true }),
  ).toHaveCount(0)
  const quick = page.getByRole('button', {
    name: 'Quick Portfolio Access',
    exact: true,
  })
  await expect(quick).not.toBeVisible()
  await expect(page.getByText('Loading station…')).not.toBeVisible()
  expect(await page.evaluate(() => '__GAME_DEBUG__' in window)).toBe(false)
  await page.locator('canvas').click({ position: { x: 500, y: 500 } })
  await expect
    .poll(() => page.evaluate(() => !!document.pointerLockElement))
    .toBe(true)
  await page.keyboard.press('Escape')
  await expect
    .poll(() => page.evaluate(() => !!document.pointerLockElement))
    .toBe(false)
  await expect(quick).toBeVisible()
  await quick.click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download CV (PDF)', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.physical-archive')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await page
    .getByRole('button', { name: 'Accessible HTML portfolio', exact: true })
    .click()
  await expect(page.locator('canvas')).not.toBeVisible()
  await page
    .getByRole('button', { name: 'Back to station', exact: true })
    .click()
  await expect(page.locator('canvas')).toBeVisible()
  expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
  expect(await page.evaluate(() => '__GAME_DEBUG__' in window)).toBe(false)
  expect(errors).toEqual([])
  expect(violations).toEqual([])

  // Playwright evaluate itself bypasses CSP; a DOM-inserted script does not.
  // Deliberately exercise enforcement only after checking normal app behavior.
  await page.evaluate(() => {
    const script = document.createElement('script')
    script.textContent =
      "document.documentElement.dataset.cspProbe = 'executed'"
    document.head.append(script)
    script.remove()
  })
  await expect.poll(() => violations).toContain('script-src-elem')
  expect(
    await page.evaluate(() => document.documentElement.dataset.cspProbe),
  ).toBeUndefined()
  expect(violations).toEqual(['script-src-elem'])
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatch(/Content Security Policy|script-src/)
})
