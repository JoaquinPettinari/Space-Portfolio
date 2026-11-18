import { expect, test } from '@playwright/test'
import { enter, lookAt, snapshot, walkTo } from './helpers/game'
import { CABIN_MASTER_COLLIDERS } from '../src/game/world/cabinMasterLayout'
import shellLayout from '../src/game/world/arrivalShellLayout.json' with { type: 'json' }

for (const [end, z] of [
  ['forward', 12.35],
  ['aft', 18.0],
] as const) {
  test(`technical wall ${end} end prevents walking behind the equipment`, async ({
    page,
  }, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto('/')
    await expect(page.getByLabel('Game controls')).toBeVisible({
      timeout: 90000,
    })
    await enter(page)
    await walkTo(page, 0, 14)
    await walkTo(page, 2.8, 14)
    await walkTo(page, 2.8, z)
    await lookAt(page, {
      x: 5.5,
      y: (await snapshot(page)).cameraPosition.y,
      z,
    })
    await page.keyboard.down('w')
    try {
      await page.waitForTimeout(1600)
    } finally {
      await page.keyboard.up('w')
    }
    const endPosition = (await snapshot(page)).cameraPosition
    await lookAt(page, { x: 4.65, y: endPosition.y, z: 15.5 })
    await page.screenshot({ path: info.outputPath(`technical-${end}-gap.png`) })
    await info.attach('technical-end-position', {
      body: JSON.stringify({ end, endPosition }),
      contentType: 'application/json',
    })
    // The technical wall starts at x=3.56. Its end closures must prevent
    // reaching the inaccessible strip between the cabinet and hull.
    expect(endPosition.x).toBeLessThan(3.56)
    expect(endPosition.x).toBeGreaterThan(2.8)
    await walkTo(page, 2.8, 14)
    await walkTo(page, 0, 14)
    await walkTo(page, 0, 17.9)
    await lookAt(page, { x: 0, y: 0.5, z: 20.2 })
    await page.screenshot({
      path: info.outputPath(`docking-visor-floor-${end}.png`),
    })
    expect((await snapshot(page)).pointerLocked).toBe(true)
    expect(errors).toEqual([])
  })
}

test('master ledge and service furniture block rear gaps while the cleared lounge remains walkable', async ({
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
  const ledge = CABIN_MASTER_COLLIDERS.find(
    ({ id }) => id === 'observation-ledge',
  )!
  const service = CABIN_MASTER_COLLIDERS.find(
    ({ id }) => id === 'technical-wall',
  )!
  // This waypoint occupied the former sofa. It must now be reachable.
  await walkTo(page, -3.25, 16)
  const ledgeHit = await pushToward(-5.2, 16)
  expect(ledgeHit.x).toBeGreaterThan(ledge.position[0] + ledge.halfSize[0])
  expect(ledgeHit.x).toBeLessThan(-3.35)
  await walkTo(page, 0, 16)
  await lookAt(page, { x: -3.55, y: 0.82, z: 16.05 })
  await page.screenshot({ path: testInfo.outputPath('observation-ledge.png') })
  for (const z of [13.6, 15.9, 17.1]) {
    await walkTo(page, 2.8, z)
    const hit = await pushToward(5, z)
    expect(hit.x).toBeLessThan(service.position[0] - service.halfSize[0])
    expect(hit.x).toBeGreaterThan(3)
    await walkTo(page, 2.6, z)
  }
  await walkTo(page, 0, 15)
  await lookAt(page, { x: 4, y: 1.2, z: 15.4 })
  await page.screenshot({ path: testInfo.outputPath('service-bank.png') })
  await lookAt(page, { x: -2.35, y: 1.2, z: 12.2 })
  await page.screenshot({ path: testInfo.outputPath('side-service-hatch.png') })
  // EVA vitrine closes the aft approach; the shelf blocks its forward end.
  await walkTo(page, 0, 17.65)
  const rearHit = await pushToward(-5, 17.65)
  expect(rearHit.x).toBeGreaterThan(-1.5)
  await walkTo(page, 0, 17.65)
  await walkTo(page, 0, 14.1)
  await walkTo(page, -3.25, 14.1)
  const forwardHit = await pushToward(-5.2, 14.1)
  expect(forwardHit.x).toBeGreaterThan(ledge.position[0] + ledge.halfSize[0])
  expect(forwardHit.x).toBeLessThan(-3.35)
  await walkTo(page, 0, 14.1)
  await walkTo(page, 0, 13.3)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})

test('jumping beside the observation ledge cannot cross the window or ceiling shell', async ({
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
  const approachZ = 14.1
  await walkTo(page, 0, approachZ)
  await walkTo(page, -3.35, approachZ)
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
  // Jump against the low ledge and repeat from any landed position. The glass
  // and shoulder must contain the capsule even if it reaches the shelf top.
  await jumpToward(-6, approachZ)
  expect(Math.max(...attempts[0].samples.map((p) => p.y))).toBeGreaterThan(
    floorEye + 0.2,
  )
  await jumpToward(-6, approachZ)
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
