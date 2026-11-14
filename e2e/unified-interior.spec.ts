import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('unified interior blocks the locked door and sloped service bay while preserving the full return route', async ({
  page,
}, info) => {
  test.setTimeout(240_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 60_000,
  })
  await enter(page)
  await walkTo(page, 0, 13.3)
  await lookAt(page, { x: 0, y: 1.7, z: 0 })
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(1400)
  } finally {
    await page.keyboard.up('w')
  }
  const locked = await snapshot(page)
  expect(locked.session.bulkheadPhase).toBe('closed')
  expect(locked.cameraPosition.z).toBeGreaterThan(11.95)
  expect(locked.cameraPosition.z).toBeLessThan(12.5)
  expect(locked.cameraPosition.y).toBeGreaterThan(1.6)
  await walkTo(page, 0, 13.3)
  await enterObservationRoom(page)
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await walkTo(page, 0, 15.8)
  await lookAt(page, { x: 12, y: 1.7, z: 15.8 })
  await page.keyboard.down('w')
  try {
    await page.waitForTimeout(1600)
  } finally {
    await page.keyboard.up('w')
  }
  const bay = await snapshot(page)
  expect(bay.cameraPosition.x).toBeGreaterThan(3.3)
  expect(bay.cameraPosition.x).toBeLessThan(3.85)
  expect(bay.cameraPosition.y).toBeGreaterThan(1.6)
  expect(bay.cameraPosition.y).toBeLessThan(1.9)
  await walkTo(page, 0, 15.8)
  await lookAt(page, { x: 1, y: 1.9, z: 12 })
  await page.screenshot({
    path: info.outputPath('unified-arrival-after-collision.png'),
  })
  await walkTo(page, 0, 17.065)
  const returned = await snapshot(page)
  expect(returned.pointerLocked).toBe(true)
  expect(returned.cameraPosition.y).toBeGreaterThan(1.6)
  expect(returned.cameraPosition.y).toBeLessThan(1.85)
  expect(errors).toEqual([])
  await writeFile(
    info.outputPath('unified-collision-walk.json'),
    JSON.stringify(
      {
        locked: locked.cameraPosition,
        bay: bay.cameraPosition,
        returned: returned.cameraPosition,
      },
      null,
      2,
    ),
  )
})
