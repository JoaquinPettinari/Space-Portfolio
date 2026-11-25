import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'

test.use({ screenshot: 'only-on-failure', video: 'off', trace: 'off' })
test('galley remains reachable and its countertop blocks walking through the cabinet', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120000,
  })
  await enterObservationRoom(page)
  await walkTo(page, 2.5, -0.5)
  await lookAt(page, { x: 3.4, y: 1.8, z: 1.5 })
  await page.screenshot({ path: info.outputPath('galley-in-app.png') })
  await walkTo(page, 3.0, 0.35)
  const before = (await snapshot(page)).cameraPosition
  await lookAt(page, { x: before.x, y: before.y, z: 2.5 })
  try {
    await page.keyboard.down('w')
    await page.waitForTimeout(1200)
  } finally {
    await page.keyboard.up('w')
  }
  const after = (await snapshot(page)).cameraPosition
  expect(after.z).toBeGreaterThan(before.z + 0.1)
  expect(after.z).toBeLessThan(1.15)
  expect(after.y).toBeLessThan(1.9)
  expect(errors).toEqual([])
})

test('opposite entrance corner stays reachable with a clear aisle', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120000,
  })
  await enterObservationRoom(page)
  await walkTo(page, -2.6, -0.4)
  await lookAt(page, { x: -4.1, y: 1.8, z: 1.55 })
  await page.screenshot({ path: info.outputPath('port-corner-in-app.png') })
  await walkTo(page, -3.1, 0.35)
  await walkTo(page, -2.6, -0.4)
  expect(errors).toEqual([])
})
