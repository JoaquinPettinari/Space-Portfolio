import { expect, test } from '@playwright/test'
import type {} from '../src/game/debug/GameDiagnostics'

test('starts directly in the production station and keeps portfolio access secondary', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
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
  await page.keyboard.press('Escape')
  await expect(quick).toBeVisible()
  await quick.click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download CV (PDF)', exact: true }),
  ).toBeVisible()
  await expect(page.locator('canvas')).not.toBeVisible()
  await page
    .getByRole('button', { name: 'Back to station', exact: true })
    .click()
  await expect(page.locator('canvas')).toBeVisible()
  expect(await page.evaluate(() => !!document.pointerLockElement)).toBe(false)
  expect(await page.evaluate(() => '__GAME_DEBUG__' in window)).toBe(false)
  expect(errors).toEqual([])
})
