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
  let mouseX = 640
  let mouseY = 360
  await page.mouse.move(mouseX, mouseY)
  for (let attempt = 0; attempt < 5; attempt++) {
    // Observe delivered raw input before calculating the next native mouse move.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
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
    const pitchDelta = desiredPitch - pitch
    if (Math.abs(yawDelta) < 0.008 && Math.abs(pitchDelta) < 0.008) return
    if (attempt === 4)
      throw new Error(
        `Native mouse did not settle: ${JSON.stringify({ target, p, yawDelta, pitchDelta })}`,
      )
    mouseX -= yawDelta / 0.002
    mouseY -= pitchDelta / 0.002
    await page.mouse.move(mouseX, mouseY, { steps: 4 })
  }
}

export async function enter(page: Page) {
  if ((await snapshot(page)).pointerLocked) return
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas not ready')
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  // Browser capture precedes React's active-control commit. Do not send held
  // movement keys until the gameplay controls are visibly active.
  await expect(page.locator('.crosshair')).toBeVisible()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
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
  if ((await snapshot(page)).session.bulkheadPhase === 'closed') {
    await approach(page, { x: 0, y: 1.65, z: 5.12 }, 'E · Open bulkhead')
    await page.keyboard.press('e')
  }
  await expect
    .poll(async () => (await snapshot(page)).session.bulkheadPhase)
    .toBe('open')
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

/** Walk to a free floor waypoint with actual WASD; never teleport the capsule. */
export async function walkTo(page: Page, x: number, z: number) {
  const pose = (await snapshot(page)).cameraPosition
  await lookAt(page, { x, y: pose.y, z })
  await page.keyboard.down('w')
  try {
    await expect
      .poll(
        async () => {
          const p = (await snapshot(page)).cameraPosition
          return Math.hypot(p.x - x, p.z - z)
        },
        { intervals: [25], timeout: 15000 },
      )
      .toBeLessThan(0.3)
  } finally {
    await page.keyboard.up('w')
  }
  await page.waitForTimeout(100)
}

export async function forwardStation(page: Page, side: -1 | 1) {
  await walkTo(page, side * 2.4, 3.1)
  await walkTo(page, side * 2.4, -1.2)
  await approach(
    page,
    { x: side * 2.4, y: 1.65, z: -3.715 },
    side === -1 ? 'E · Use computer' : 'E · Earth Communications',
  )
}

export async function approachCrew(page: Page) {
  await enterObservationRoom(page)
  await walkTo(page, 2.05, 3.2)
  await approach(page, { x: 2.05, y: 1.65, z: 4.65 }, 'E · Crew Access')
}

export async function protocol(
  page: Page,
): Promise<{ completed: string[]; guidance: string }> {
  return (await snapshot(page)).session.protocol
}
