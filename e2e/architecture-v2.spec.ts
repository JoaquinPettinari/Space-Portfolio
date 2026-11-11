import { expect, test } from '@playwright/test'
import {
  enter,
  enterEntryModule,
  restoreEntryPower,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'
test.setTimeout(180000)

test('detailed passage bay loads in isolation with orbit inspection and roof toggle', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/?architecture-preview&bay')
  await expect(
    page.getByText('bay: 4.15 × 3.40 × 2.03 m; 20 meshes; 9144 triangles.'),
  ).toBeVisible({ timeout: 60000 })
  await expect(page.getByLabel('Module')).toHaveValue('bay')
  await page.getByRole('button', { name: 'View inside' }).click()
  await page.getByLabel('Roof', { exact: true }).uncheck()
  await page.getByLabel('Bounding boxes').uncheck()
  await page.getByRole('button', { name: 'View outside' }).click()
  await page.mouse.move(800, 400)
  await page.mouse.down()
  await page.mouse.move(900, 430, { steps: 6 })
  await page.mouse.up()
  await page.mouse.wheel(0, -200)
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByLabel('Game controls')).toHaveCount(0)
  expect(errors).toEqual([])
})
test('interior arrival requires only identity, opens the secured bulkhead automatically and permits return', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enter(page)
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(15, 1)
  const initial = await snapshot(page)
  expect(initial.cameraPosition.x).toBeCloseTo(0, 2)
  expect(initial.cameraRotation).toEqual({ x: 0, y: 0, z: 0, w: 1 })
  // The rear docking hatch is now closed; no annex is part of the playable route.
  await page.keyboard.down('s')
  try {
    await page.waitForTimeout(800)
    const rear = await snapshot(page)
    expect(rear.cameraPosition.z).toBeGreaterThan(15.5)
    expect(rear.cameraPosition.z).toBeLessThan(15.9)
    expect(rear.cameraPosition.y).toBeGreaterThan(1.6)
  } finally {
    await page.keyboard.up('s')
  }
  await enterEntryModule(page)
  const arrival = await snapshot(page)
  // The expanded lounge remains reachable, but its bench is solid.
  await walkTo(page, -1.5, 14.72)
  await lookAt(page, { x: -5, y: 1.7, z: 14.72 })
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.x)
      .toBeLessThan(-1.8)
    await page.waitForTimeout(600)
    expect((await snapshot(page)).cameraPosition.x).toBeGreaterThan(-2.45)
    expect((await snapshot(page)).cameraPosition.y).toBeGreaterThan(1.6)
  } finally {
    await page.keyboard.up('w')
  }
  await walkTo(page, 0, 14.72)
  expect(arrival.powerSwitchCount).toBe(0)
  expect((await snapshot(page)).session.protocol.completed).toEqual([
    'lighting',
  ])
  await restoreEntryPower(page)
  await lookAt(page, { x: 0, y: 1.65, z: 11.65 })
  await page.keyboard.press('e')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('closed')
  await enterObservationRoom(page)
  const bridge = await snapshot(page)
  const measurements = [arrival, bridge].map((state, index) => ({
    location: index === 0 ? 'arrival' : 'bridge-after-passage',
    position: state.cameraPosition,
    drawCalls: state.drawCalls,
    triangles: state.triangles,
    resources: state.resources,
    frameMs: state.frameMs,
  }))
  await info.attach('arrival-and-bridge-render-observations', {
    body: JSON.stringify(measurements),
    contentType: 'application/json',
  })
  console.log('ARRIVAL_RENDER_OBSERVATIONS', JSON.stringify(measurements))
  expect((await snapshot(page)).session.protocol.completed).toEqual([
    'lighting',
    'crew',
  ])
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await walkTo(page, 0, 15)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await page.reload()
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  expect((await snapshot(page)).session.protocol.completed).toEqual([
    'lighting',
  ])
  expect((await snapshot(page)).session.bulkheadPhase).toBe('closed')
  expect((await snapshot(page)).cameraPosition.z).toBeCloseTo(15, 1)
  expect(errors).toEqual([])
})

test('development asset preview loads the three original modules and offers inspection controls', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/?architecture-preview')
  await expect(
    page.getByText('entry: 5.66 × 3.24 × 3.60 m; 23 meshes; 1338 triangles.'),
  ).toBeVisible({ timeout: 60000 })
  await expect(
    page.getByText('passage: 3.79 × 3.18 × 3.80 m; 23 meshes; 852 triangles.'),
  ).toBeVisible()
  await expect(
    page.getByText('bridge: 9.45 × 3.70 × 10.84 m; 97 meshes; 5122 triangles.'),
  ).toBeVisible()
  await page.getByLabel('Module').selectOption('entry')
  await page.getByRole('button', { name: 'View inside' }).click()
  await expect(page.getByRole('button', { name: 'View outside' })).toBeVisible()
  await page.getByLabel('Roof', { exact: true }).uncheck()
  await page.getByLabel('Reference props').uncheck()
  await page.getByLabel('Bounding boxes').uncheck()
  await page.getByLabel('Module').selectOption('all')
  await page.getByRole('button', { name: 'View outside' }).click()
  await expect(page.locator('canvas')).toBeVisible()
  expect(errors).toEqual([])
})

test('compact bow is reachable in front of the diagonal consoles, contains the player and exposes the exterior deck', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await walkTo(page, 2.6, 3.5)
  await walkTo(page, 2.6, -1.5)
  await walkTo(page, 3.95, -1.8)
  await walkTo(page, 3.25, -1.9)
  await walkTo(page, 0, -1.9)
  await walkTo(page, 0, -3.3)
  await lookAt(page, { x: 0, y: 0.67, z: -6.85 })
  await expect
    .poll(async () => (await snapshot(page)).explorationHull.noseInSight)
    .toBe(true)
  await page.keyboard.down('w')
  try {
    await expect
      .poll(async () => (await snapshot(page)).cameraPosition.z)
      .toBeLessThan(-3.7)
    await page.waitForTimeout(800)
    expect((await snapshot(page)).cameraPosition.z).toBeGreaterThan(-3.87)
    expect((await snapshot(page)).cameraPosition.y).toBeGreaterThan(1.6)
  } finally {
    await page.keyboard.up('w')
  }
  await walkTo(page, 0, -2.5)
  // Jump under the forward canopy: the camera keeps headroom and lands on the floor.
  await page.keyboard.press('Space')
  await expect
    .poll(async () => (await snapshot(page)).maxEyeHeight)
    .toBeGreaterThan(2.1)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.8)
  expect((await snapshot(page)).maxEyeHeight).toBeLessThan(2.62)
  await walkTo(page, 0, -1.9)
  await walkTo(page, -3.25, -1.9)
  await walkTo(page, -3.95, -1.8)
  await walkTo(page, -3.95, -1.5)
  await walkTo(page, -2.4, 3.1)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
