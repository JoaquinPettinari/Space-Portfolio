import { expect, test } from '@playwright/test'
import {
  enterObservationRoom,
  walkTo,
  approach,
  snapshot,
} from './helpers/game'
import { TERMINAL_SCREENS } from '../src/game/interaction/station'

test('fourth desk offers optional commands and puzzle and restores native mouse control', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await walkTo(page, -2, 0.5)
  const [x, y, z] = TERMINAL_SCREENS.arcade.position
  await walkTo(page, -2, z)
  await approach(page, { x, y, z }, 'E Recreation Terminal')
  await page.keyboard.press('e')
  const terminal = page.getByRole('dialog', { name: 'Recreation Terminal' })
  await expect(terminal).toBeVisible()
  await expect(terminal).toHaveClass(/physical/)
  const input = terminal.getByRole('textbox')
  await input.fill('help')
  await input.press('Enter')
  await expect(terminal.getByRole('log')).toContainText('Available commands')
  await terminal
    .getByRole('button', { name: 'Signal Puzzle', exact: true })
    .click()
  await terminal.getByRole('button', { name: 'Channel 1: Off' }).click()
  await terminal.getByRole('button', { name: 'Channel 3: Off' }).click()
  await expect(terminal.getByRole('status')).toContainText('Signal aligned!')
  const fit = await terminal
    .locator('.desktop-content')
    .evaluate(
      (el) =>
        el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight,
    )
  expect(fit).toBe(true)
  await page.keyboard.press('Escape')
  await expect(terminal).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
