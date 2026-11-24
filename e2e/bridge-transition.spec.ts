import { expect, test } from '@playwright/test'
import {
  enterObservationRoom,
  walkTo,
  lookAt,
  snapshot,
  approach,
} from './helpers/game'
import { TABLE_POSITION } from '../src/game/interaction/station'

test('crosses the clear transition both ways, collides with its side and uses the relocated table', async ({
  page,
}, info) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await walkTo(page, 0, 3.6)
  await lookAt(page, {
    x: 1.34,
    y: (await snapshot(page)).cameraPosition.y,
    z: 3.6,
  })
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.x)
      .toBeGreaterThan(0.9)
    // Observe contact before a diagonal hold can slide past the narrow pilaster.
    await page.waitForTimeout(100)
  } finally {
    await page.keyboard.up('w')
  }
  const blocked = (await snapshot(page)).cameraPosition
  expect(blocked.x).toBeGreaterThan(0.8)
  // New projecting pilaster stops the capsule before its face at X=1.34.
  expect(blocked.x).toBeLessThan(1.12)
  expect(blocked.y).toBeGreaterThan(1.5)
  await walkTo(page, 0, 3.6)
  await walkTo(page, 0, 6)
  await walkTo(page, 0, 1.3)
  await walkTo(page, 0, -0.2)
  await approach(
    page,
    { x: TABLE_POSITION[0], y: 1.04, z: TABLE_POSITION[2] + 1.15 },
    'E · Tactical Table',
  )
  await page.screenshot({ path: info.outputPath('tabletop-hover.png') })
  await page.keyboard.press('e')
  const table = page.getByRole('dialog', { name: 'Tactical Table' })
  await expect(table).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(table).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
