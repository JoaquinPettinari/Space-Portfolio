import { expect, test } from '@playwright/test'
import { enter } from './helpers/game'
test('held tablet raises and lowers through real controls', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  await page.waitForTimeout(1200)
  await page.keyboard.press('t')
  await expect(page.getByLabel('Held mission tablet')).toBeVisible()
  await page.waitForTimeout(700)
  await page.screenshot({ path: info.outputPath('tablet.png') })
  await page.keyboard.press('t')
  await expect(page.getByLabel('Held mission tablet')).not.toBeVisible()
  expect(errors).toEqual([])
})
