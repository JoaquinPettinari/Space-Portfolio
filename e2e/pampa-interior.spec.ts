import { expect, test } from '@playwright/test'
import { enter, lookAt, snapshot, walkTo } from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

test('parked PAMPA loads behind the inaccessible docking glass', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  await walkTo(page, 0, 17.1)
  await lookAt(page, { x: 0, y: 1.5, z: 20 })
  if (process.env.PAMPA_REVIEW_CAPTURE === '1') {
    await page.screenshot({ path: test.info().outputPath('pampa-visor.png') })
    console.log('PAMPA_REVIEW', JSON.stringify(await snapshot(page)))
  }
  const inventory = await page.evaluate(() =>
    window.__GAME_DEBUG__?.renderInventory(),
  )
  expect(inventory?.some((item) => item.name.includes('PAMPA'))).toBe(true)
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((item) => item.name),
  )
  expect(
    resources.filter((url) => url.endsWith('/models/pampa-interior-nose.glb')),
  ).toHaveLength(1)
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(1200)
  } finally {
    await page.keyboard.up('w')
  }
  expect((await snapshot(page)).cameraPosition.z).toBeLessThan(18.1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume mission' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
