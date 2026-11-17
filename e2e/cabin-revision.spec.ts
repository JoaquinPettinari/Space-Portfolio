import { expect, test } from '@playwright/test'
import { enter, lookAt, snapshot, walkTo } from './helpers/game'
import cabinLayout from '../src/game/world/arrivalCabinLayout.json' with { type: 'json' }
import shellLayout from '../src/game/world/arrivalShellLayout.json' with { type: 'json' }

test('arrival furniture closes rear gaps and keeps the main route clear', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  const pushToward = async (x: number, z: number) => {
    await lookAt(page, { x, y: (await snapshot(page)).cameraPosition.y, z })
    await page.keyboard.down('w')
    try {
      await page.waitForTimeout(1000)
    } finally {
      await page.keyboard.up('w')
    }
    return (await snapshot(page)).cameraPosition
  }
  // Real movement into the bench front and both service gaps, not teleporting.
  await walkTo(page, -2.45, 16)
  const benchHit = await pushToward(-5.2, 16)
  expect(benchHit.x).toBeGreaterThan(
    cabinLayout.bench.x + cabinLayout.bench.depth / 2,
  )
  expect(benchHit.x).toBeLessThan(-2.65)
  await walkTo(page, 0, 16)
  await lookAt(page, { x: -3.55, y: 0.82, z: 16.05 })
  await page.screenshot({ path: testInfo.outputPath('straight-lounge.png') })
  for (const z of [13.6, 15.9, 17.1]) {
    await walkTo(page, 2.8, z)
    const hit = await pushToward(5, z)
    expect(hit.x).toBeLessThan(cabinLayout.serviceBay.frontX)
    expect(hit.x).toBeGreaterThan(3)
    await walkTo(page, 2.6, z)
  }
  await walkTo(page, 0, 15)
  await lookAt(page, { x: 4, y: 1.2, z: 15.4 })
  await page.screenshot({ path: testInfo.outputPath('service-bank.png') })
  await lookAt(page, { x: -2.35, y: 1.2, z: 12.2 })
  await page.screenshot({ path: testInfo.outputPath('side-service-hatch.png') })
  // Attempt both end routes. Rear outfitting already blocks the aft approach;
  // the new bench/sill must close the forward approach as well.
  await walkTo(page, 0, 17.65)
  const rearHit = await pushToward(-5, 17.65)
  expect(rearHit.x).toBeGreaterThan(-1.5)
  await walkTo(page, 0, 17.65)
  await walkTo(page, 0, 14.1)
  await walkTo(page, -3.4, 14.1)
  const forwardHit = await pushToward(-3.4, 16)
  expect(forwardHit.z).toBeLessThan(cabinLayout.bench.startZ)
  expect(forwardHit.z).toBeGreaterThan(14.3)
  await walkTo(page, 0, 14.1)
  await walkTo(page, 0, 13.3)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})

test('jumping beside the lounge cannot cross the window or ceiling shell', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  await walkTo(page, 0, cabinLayout.sideTable.z)
  await walkTo(page, -3.35, cabinLayout.sideTable.z)
  const floorEye = (await snapshot(page)).cameraPosition.y
  const attempts: {
    target: { x: number; z: number }
    samples: { x: number; y: number; z: number }[]
  }[] = []
  const jumpToward = async (x: number, z: number) => {
    await lookAt(page, { x, y: (await snapshot(page)).cameraPosition.y, z })
    await page.keyboard.down('w')
    await page.keyboard.down('Space')
    try {
      // Observe every rendered frame during native input. This never changes
      // position, physics, controls or the debug interface.
      const samples = await page.evaluate(
        () =>
          new Promise<{ x: number; y: number; z: number }[]>((resolve) => {
            const positions: { x: number; y: number; z: number }[] = []
            const start = performance.now()
            const record = () => {
              const diagnostics = window.__GAME_DEBUG__
              if (!diagnostics) throw new Error('Diagnostics not ready')
              positions.push(diagnostics.snapshot().cameraPosition)
              if (performance.now() - start >= 1400) resolve(positions)
              else requestAnimationFrame(record)
            }
            requestAnimationFrame(record)
          }),
      )
      attempts.push({ target: { x, z }, samples })
      expect(samples.length).toBeGreaterThan(5)
      for (const p of samples) {
        const shoulderProgress = Math.max(
          0,
          (p.y - shellLayout.shoulderY) /
            (shellLayout.roofY - shellLayout.shoulderY),
        )
        const wallX =
          shellLayout.wallX -
          shoulderProgress * (shellLayout.wallX - shellLayout.roofX)
        expect(p.y, JSON.stringify(p)).toBeLessThan(shellLayout.roofY - 0.1)
        expect(Math.abs(p.x), JSON.stringify(p)).toBeLessThan(wallX - 0.1)
        expect(p.z, JSON.stringify(p)).toBeGreaterThan(shellLayout.startZ)
        expect(p.z, JSON.stringify(p)).toBeLessThan(shellLayout.endZ)
      }
    } finally {
      await page.keyboard.up('Space')
      await page.keyboard.up('w')
    }
    await page.waitForTimeout(300)
  }
  // Reproduce the stepping-stone approach: jump at the low display table,
  // then push toward the glass and toward the rear of the taller sofa.
  await jumpToward(-6, cabinLayout.sideTable.z)
  expect(Math.max(...attempts[0].samples.map((p) => p.y))).toBeGreaterThan(
    floorEye + 0.2,
  )
  await jumpToward(-6, cabinLayout.sideTable.z)
  await lookAt(page, { x: -4.7, y: 2.85, z: 12.2 })
  await page.screenshot({
    path: testInfo.outputPath('straight-shell-side.png'),
  })
  await jumpToward(-4.6, 16)
  await jumpToward(-6, 16)
  await testInfo.attach('native-jump-positions', {
    body: JSON.stringify(attempts, null, 2),
    contentType: 'application/json',
  })
  await walkTo(page, 0, 14.2)
  await lookAt(page, { x: -3.6, y: 2.25, z: 16 })
  await page.screenshot({
    path: testInfo.outputPath('straight-shell-wide.png'),
  })
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
