import { expect, type Page } from '@playwright/test'

/** Portfolio routes belong to pause, independent of the read-only held tablet. */
export async function openPausePortfolio(
  page: Page,
  action: 'Quick Portfolio Access' | 'Read without 3D',
) {
  const held = page.getByRole('region', { name: 'Held mission tablet' })
  if (await held.isVisible()) {
    await page.keyboard.press('t')
    await expect(held).not.toBeVisible()
  }
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  if (!(await pause.isVisible())) await page.keyboard.press('Escape')
  await expect(pause).toBeVisible()
  await pause.getByRole('button', { name: action, exact: true }).click()
}
