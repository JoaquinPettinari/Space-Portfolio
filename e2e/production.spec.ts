import { expect, test } from '@playwright/test'
import type {} from '../src/game/debug/GameDiagnostics'

test('loads directly into the station and excludes debug API from production', async ({
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
    page.getByRole('heading', { name: 'Explore the station' }),
  ).not.toBeVisible()
  await expect(page.getByText('Loading station…')).not.toBeVisible()
  expect(await page.evaluate(() => '__GAME_DEBUG__' in window)).toBe(false)
  expect(errors).toEqual([])
})
