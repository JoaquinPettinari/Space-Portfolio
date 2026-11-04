import { expect, test } from '@playwright/test'
import type {} from '../src/game/debug/GameDiagnostics'

test('defers 3D download and excludes debug API from production', async ({
  page,
}) => {
  const scripts: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Cargar experiencia 3D' }),
  ).toBeVisible()
  expect(scripts.some((url) => /\/Game-/.test(url))).toBe(false)
  await page.getByRole('button', { name: 'Cargar experiencia 3D' }).click()
  await expect(
    page.getByRole('button', { name: 'Entrar / continuar' }),
  ).toBeEnabled({ timeout: 15_000 })
  expect(scripts.some((url) => /\/Game-/.test(url))).toBe(true)
  expect(await page.evaluate(() => '__GAME_DEBUG__' in window)).toBe(false)
  expect(errors).toEqual([])
})
