import { expect, type Page } from '@playwright/test'
import type { GameSnapshot } from '../../src/game/debug/GameDiagnostics'

export async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}

/** Real input only: diagnostics observe the pose, never alter it. */
export async function lookAt(
  page: Page,
  target: { x: number; y: number; z: number },
) {
  await page.mouse.move(640, 360)
  const { cameraPosition: p, cameraRotation: q } = await snapshot(page)
  const yaw = Math.atan2(
    2 * (q.x * q.z + q.y * q.w),
    1 - 2 * (q.x * q.x + q.y * q.y),
  )
  const pitch = Math.asin(
    Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z))),
  )
  const desiredYaw = Math.atan2(p.x - target.x, p.z - target.z)
  const desiredPitch = Math.atan2(
    target.y - p.y,
    Math.hypot(target.x - p.x, target.z - p.z),
  )
  const yawDelta = Math.atan2(
    Math.sin(desiredYaw - yaw),
    Math.cos(desiredYaw - yaw),
  )
  await page.mouse.move(
    640 - yawDelta / 0.002,
    360 - (desiredPitch - pitch) / 0.002,
    { steps: 4 },
  )
}

export async function enter(page: Page) {
  if ((await snapshot(page)).pointerLocked) return
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas not ready')
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
}

/** Complete the real airlock entry, then stop on the observation-room floor. */
export async function enterObservationRoom(page: Page) {
  await enter(page)
  if ((await snapshot(page)).cameraPosition.z < 5) return
  const hadPower =
    (await protocol(page)).completed?.includes('lighting') ?? false
  if (!hadPower) {
    await lookAt(page, { x: -1.4, y: 1.65, z: 6.1 })
    await expect(
      page.getByText('E · Restore lighting', { exact: true }),
    ).toBeVisible()
    await page.keyboard.press('e')
    await expect
      .poll(async () => (await protocol(page)).completed)
      .toContain('lighting')
  }
  await lookAt(page, { x: 0, y: 1.65, z: 4.86 })
  const bulkhead = page.getByText('E · Open bulkhead', { exact: true })
  if (!hadPower) await expect(bulkhead).toBeVisible()
  if (await bulkhead.isVisible()) {
    await page.keyboard.press('e')
    await expect(bulkhead).not.toBeVisible()
  }
  await lookAt(page, { x: 0, y: (await snapshot(page)).cameraPosition.y, z: 0 })
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z, {
        intervals: [30, 50],
      })
      .toBeLessThan(3.55)
  } finally {
    await page.keyboard.up('w')
  }
  await page.waitForTimeout(150)
  await lookAt(page, {
    x: 0,
    y: (await snapshot(page)).cameraPosition.y,
    z: -4,
  })
}

export async function approach(
  page: Page,
  target: { x: number; y: number; z: number },
  hint: string,
) {
  await lookAt(page, target)
  await page.keyboard.down('w')
  try {
    await expect(page.getByText(hint, { exact: true })).toBeVisible()
  } finally {
    await page.keyboard.up('w')
  }
  // Re-aim from the approach position, not the initial distant viewing angle.
  await lookAt(page, target)
  await expect(page.getByText(hint, { exact: true })).toBeVisible()
}

export async function protocol(
  page: Page,
): Promise<{ completed: string[]; guidance: string }> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem('cruz-del-sur.protocol') ?? '{}'),
  )
}
