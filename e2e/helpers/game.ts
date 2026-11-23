import {
  BRIDGE_OFFSET_Z,
  bridgePoint,
} from '../../src/game/world/bridgePlacement'
import { CREW_ACCESS_POSITION } from '../../src/game/interaction/station'
import { COMMAND_POSES } from '../../src/game/world/commandLayout'
import { expect, type Page } from '@playwright/test'
import type { GameSnapshot } from '../../src/game/debug/GameDiagnostics'

export async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}

/** Real input only: diagnostics observe the pose, never alter it. */
async function moveMouseAndObserve(page: Page, x: number, y: number) {
  // Arm before sending input. CDP accepting a move does not mean the page has
  // consumed its Pointer Lock delta, especially during software WebGL rendering.
  const observer = await page.evaluateHandle(() => {
    let dispose = () => {}
    const delivered = new Promise<{ x: number; y: number } | null>(
      (resolve) => {
        let firstFrame = 0
        let secondFrame = 0
        let settled = 0
        const delta = { x: 0, y: 0 }
        const timeout = window.setTimeout(() => {
          dispose()
          resolve(null)
        }, 3000)
        const moved = (event: MouseEvent) => {
          if (!event.isTrusted || !document.pointerLockElement) return
          delta.x += event.movementX
          delta.y += event.movementY
          cancelAnimationFrame(firstFrame)
          cancelAnimationFrame(secondFrame)
          clearTimeout(settled)
          // Raw-input bursts can continue after two render frames. Wait for a
          // quiet interval measured from the last delivered event, not the send.
          settled = window.setTimeout(() => {
            firstFrame = requestAnimationFrame(() => {
              secondFrame = requestAnimationFrame(() => {
                dispose()
                resolve(delta)
              })
            })
          }, 150)
        }
        dispose = () => {
          clearTimeout(timeout)
          clearTimeout(settled)
          cancelAnimationFrame(firstFrame)
          cancelAnimationFrame(secondFrame)
          document.removeEventListener('mousemove', moved)
        }
        document.addEventListener('mousemove', moved)
      },
    )
    return { delivered, dispose: () => dispose() }
  })
  try {
    await page.mouse.move(x, y)
    const delta = await observer.evaluate(async (value) => value.delivered)
    if (!delta)
      throw new Error(`Native mouse move was not delivered: ${x}, ${y}`)
    return delta
  } finally {
    await observer.evaluate((value) => value.dispose())
    await observer.dispose()
  }
}

export async function lookAt(
  page: Page,
  target: { x: number; y: number; z: number },
) {
  // Pointer Lock returns before the station camera's return transition ends.
  // The crosshair only appears once walking/mouse controls are actually enabled.
  await expect(page.locator('.crosshair')).toBeVisible()
  const viewport = page.viewportSize()
  let mouseX = (viewport?.width ?? 1280) / 2
  let mouseY = (viewport?.height ?? 720) / 2
  let delivered = await moveMouseAndObserve(page, mouseX, mouseY)
  const movements = []
  for (let attempt = 0; attempt < 12; attempt++) {
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
    movements.push({ mouseX, mouseY, delivered, yawDelta, pitchDelta })
    if (Math.abs(yawDelta) < 0.008 && Math.abs(pitchDelta) < 0.008) return
    if (attempt === 11)
      throw new Error(
        `Native mouse did not settle: ${JSON.stringify({ target, p, movements })}`,
      )
    mouseX -= yawDelta / 0.002
    mouseY -= pitchDelta / 0.002
    // One native delta per correction avoids queued interpolation events being
    // coalesced under load while Pointer Lock is consuming relative movement.
    delivered = await moveMouseAndObserve(page, mouseX, mouseY)
  }
}

export async function enter(page: Page) {
  if ((await snapshot(page)).pointerLocked) return
  const resume = page.getByRole('button', {
    name: 'Resume mission',
    exact: true,
  })
  if (await resume.isVisible()) {
    // Resume through the actual modal action; never click through its backdrop.
    await resume.click()
  } else {
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not ready')
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  }
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  // Wait for React's active-control commit after native browser capture.
  await expect(page.locator('.crosshair')).toBeVisible()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}

export async function enterEntryModule(page: Page) {
  await enter(page)
  if ((await snapshot(page)).cameraPosition.z < 15.5) return
  // Return from the rear hatch area to the interior starting point.
  await walkTo(page, 0, 15)
}
/** Compatibility helper: arrival power is automatic; no switch is interacted with. */
export async function restoreEntryPower(page: Page) {
  await enterEntryModule(page)
  expect((await protocol(page)).completed).toContain('lighting')
}
/** Native interior arrival, identification and passage traversal, never a teleport. */
export async function enterObservationRoom(page: Page) {
  await enter(page)
  if ((await snapshot(page)).cameraPosition.z < 1.6) return
  await restoreEntryPower(page)
  if (!(await protocol(page)).completed.includes('crew')) {
    await approachCrew(page)
    const returnPosition = (await snapshot(page)).cameraPosition
    await page.keyboard.press('e')
    const terminal = page.getByRole('dialog', { name: 'Crew Access' })
    await expect(
      terminal.locator('.crew-identity').getByRole('status'),
    ).toContainText('ACCESS GRANTED')
    await expect
      .poll(async () => (await snapshot(page)).session.bulkheadPhase)
      .toBe('open')
    await terminal.getByRole('button', { name: 'Leave terminal' }).click()
    await expect
      .poll(async () => (await snapshot(page)).pointerLocked)
      .toBe(true)
    await expect
      .poll(async () => {
        const p = (await snapshot(page)).cameraPosition
        return Math.hypot(
          p.x - returnPosition.x,
          p.y - returnPosition.y,
          p.z - returnPosition.z,
        )
      })
      .toBeLessThan(0.01)
    // The dialog click moves the native cursor before Pointer Lock resumes.
    // Re-aim with real mouse input before checking the gaze-dependent hint.
    await lookAt(page, {
      x: CREW_ACCESS_POSITION[0],
      y: CREW_ACCESS_POSITION[1],
      z: CREW_ACCESS_POSITION[2],
    })
    await expect(page.locator('.interaction-hint')).toContainText('Crew Access')
  }
  await walkTo(page, 0, 13.3)
  await lookAt(page, { x: 0, y: (await snapshot(page)).cameraPosition.y, z: 0 })
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z, {
        intervals: [30, 50],
        timeout: 30000,
      })
      .toBeLessThan(1.6)
  } finally {
    await page.keyboard.up('w')
  }
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
    await expect(
      page
        .locator('.interaction-hint')
        .filter({ hasText: hint.replace(/^E\s*·?\s*/, '') }),
    ).toBeVisible()
  } finally {
    await page.keyboard.up('w')
  }
  // Re-aim from the approach position, not the initial distant viewing angle.
  await lookAt(page, target)
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: hint.replace(/^E\s*·?\s*/, '') }),
  ).toBeVisible()
}

/** Walk to a free floor waypoint with actual WASD; never teleport the capsule. */
export async function walkTo(page: Page, x: number, z: number) {
  const deadline = Date.now() + 30000
  try {
    while (Date.now() < deadline) {
      const { cameraPosition: p, cameraRotation: q } = await snapshot(page)
      const distance = Math.hypot(p.x - x, p.z - z)
      if (distance < 0.3) return
      const yaw = Math.atan2(
        2 * (q.x * q.z + q.y * q.w),
        1 - 2 * (q.x * q.x + q.y * q.y),
      )
      const desired = Math.atan2(p.x - x, p.z - z)
      if (
        Math.abs(Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw))) >
        0.015
      )
        await lookAt(page, { x, y: p.y, z })
      // Short native holds keep low-FPS software rendering from overshooting
      // a waypoint while polling. Collisions still block this real traversal.
      await page.keyboard.down('w')
      await page.waitForTimeout(
        Math.min(250, Math.max(30, ((distance - 0.18) / 3) * 1000)),
      )
      await page.keyboard.up('w')
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )
    }
    // The last native key pulse may finish after the deadline. Assert the actual
    // stopped pose, not the distance sampled before that final movement.
    await page.keyboard.up('w')
    const observed = (await snapshot(page)).cameraPosition
    const distance = Math.hypot(observed.x - x, observed.z - z)
    expect(
      distance,
      JSON.stringify({
        target: { x, z },
        observed,
      }),
    ).toBeLessThan(0.3)
  } finally {
    await page.keyboard.up('w')
  }
}

export async function forwardStation(page: Page, side: -1 | 1) {
  await walkTo(page, side * 2.4, 3.1 + BRIDGE_OFFSET_Z)
  await walkTo(page, side * 2.4, -1.2 + BRIDGE_OFFSET_Z)
  await walkTo(page, side * 0.75, -2.1 + BRIDGE_OFFSET_Z)
  const [x, y, z] = bridgePoint(
    COMMAND_POSES[side === -1 ? 'computer' : 'communications'].position,
  )
  await approach(
    page,
    { x, y, z },
    side === -1 ? 'E Use computer' : 'E · Earth Communications',
  )
}

export async function approachCrew(page: Page) {
  await restoreEntryPower(page)
  await approach(
    page,
    {
      x: CREW_ACCESS_POSITION[0],
      y: CREW_ACCESS_POSITION[1],
      z: CREW_ACCESS_POSITION[2],
    },
    'E Crew Access',
  )
}

export async function protocol(
  page: Page,
): Promise<{ completed: string[]; guidance: string }> {
  return (await snapshot(page)).session.protocol
}
