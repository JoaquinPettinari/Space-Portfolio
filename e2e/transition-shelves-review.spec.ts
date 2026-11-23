import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'
import { profileBridge } from './helpers/profileBridge'

test('reviews transition materials, photographs and passage at native scale', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const started = Date.now()
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await info.attach('loading', {
    body: JSON.stringify({
      readyMs: Date.now() - started,
      resources: await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.includes('transition'))
          .map((entry) => entry.toJSON()),
      ),
    }),
    contentType: 'application/json',
  })
  await enterObservationRoom(page)
  await walkTo(page, 0, 1.3)
  await lookAt(page, { x: 0, y: 1.4, z: 4 })
  await page.screenshot({ path: info.outputPath('overview.png') })
  const metrics = await profileBridge(page)
  await writeFile(info.outputPath('profile.json'), JSON.stringify(metrics))
  await writeFile(
    info.outputPath('renderer.json'),
    JSON.stringify(
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        const gl = canvas?.getContext('webgl2')
        const debug = gl?.getExtension('WEBGL_debug_renderer_info')
        return {
          renderer:
            gl && debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
        }
      }),
    ),
  )
  await info.attach('transition-profile', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  })
  await walkTo(page, 0, 3.6)
  for (const side of [-1, 1]) {
    await lookAt(page, { x: side * 1.73, y: 1.55, z: 3.6 })
    await page.screenshot({ path: info.outputPath(`shelves-${side}.png`) })
  }
  await walkTo(page, 0, 6)
  await walkTo(page, 0, 1.3)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
