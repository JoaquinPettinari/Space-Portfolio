import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'
import { TERMINAL_SCREENS } from '../src/game/interaction/station'

test('inspects the exterior with native dragging, zoom, reset and Pointer Lock return', async ({
  page,
}, info) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enterObservationRoom(page)
  // Walk around the tactical table, then along the clear central console aisle.
  await walkTo(page, 2.4, -0.05)
  await walkTo(page, 2.4, -4.35)
  await walkTo(page, 0, -5.5)
  const [x, y, z] = TERMINAL_SCREENS.navigation.position
  await lookAt(page, { x, y, z })
  await expect(page.locator('.interaction-hint')).toContainText(
    'Exterior inspection',
  )
  const standing = (await snapshot(page)).cameraPosition
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: 'EXTERIOR INSPECTION' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Return · E / Esc' }),
  ).toBeFocused()
  expect((await snapshot(page)).pointerLocked).toBe(false)
  const canvas = dialog.locator('canvas')
  const view = dialog.getByRole('group', {
    name: 'Draggable exterior ship view',
  })
  await expect(canvas).toBeVisible()
  await expect
    .poll(async () => {
      const rendered = await canvas.boundingBox()
      const available = await view.boundingBox()
      return rendered && available
        ? Math.max(
            Math.abs(rendered.width - available.width),
            Math.abs(rendered.height - available.height),
          )
        : Infinity
    })
    .toBeLessThan(2)
  await page.waitForTimeout(600)
  const before = await canvas.screenshot()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Exterior view has no visible bounds')
  const start = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 120, start.y + 25, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(120)
  expect((await canvas.screenshot()).equals(before)).toBe(false)
  await page.screenshot({ path: info.outputPath('exterior-dragged.png') })
  await dialog.getByRole('button', { name: 'Reset view' }).click()
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(true)
  await page.mouse.move(start.x, start.y)
  await page.mouse.wheel(0, -200)
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false)
  await dialog.getByRole('button', { name: 'Reset view' }).click()
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(true)
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
  expect((await canvas.screenshot()).equals(before)).toBe(false)
  await dialog.getByRole('button', { name: 'Reset view' }).click()
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(true)
  await view.focus()
  // Keyboard focus draws an accessible inset outline over the canvas edge.
  const keyboardBefore = await canvas.screenshot()
  await page.keyboard.press('ArrowLeft')
  expect((await canvas.screenshot()).equals(keyboardBefore)).toBe(false)
  await page.keyboard.press('Home')
  await expect
    .poll(async () => (await canvas.screenshot()).equals(keyboardBefore))
    .toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect
    .poll(async () => {
      const position = (await snapshot(page)).cameraPosition
      return Math.hypot(
        position.x - standing.x,
        position.y - standing.y,
        position.z - standing.z,
      )
    })
    .toBeLessThan(0.02)
  await expect(page.locator('.interaction-hint')).toContainText(
    'Exterior inspection',
  )
  await page.keyboard.press('e')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Return · E / Esc' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
