import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'
import { RADIO_POSITION } from '../src/game/interaction/station'
import { RADIO_BUTTONS, type RadioAction } from '../src/game/radioControls'
import { RADIO_TRACKS } from '../src/game/radioTracks'

test('gaze selects physical radio keys; E presses without camera or cursor handoff', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000)
  const errors: string[] = []
  const recordings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('request', (request) => {
    if (
      request.url().includes('/audio/radio/') &&
      request.url().endsWith('.mp3')
    )
      recordings.push(decodeURIComponent(request.url().split('/').pop()!))
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
  await enterObservationRoom(page)
  await walkTo(page, -2.65, RADIO_POSITION[2])
  const aim = async (action: RadioAction) => {
    const button = RADIO_BUTTONS.find((entry) => entry.action === action)!
    const [x, y, z] = button.position
    await lookAt(page, {
      x: RADIO_POSITION[0] + z + 0.024,
      y: RADIO_POSITION[1] + y,
      z: RADIO_POSITION[2] - x,
    })
    await expect(page.locator('.interaction-hint')).toContainText(button.label)
  }
  const press = async (action: RadioAction) => {
    await aim(action)
    await page.keyboard.press('e')
    await page.waitForTimeout(650)
    await expect
      .poll(async () => (await snapshot(page)).radio?.pressing)
      .toBeNull()
  }
  await lookAt(page, {
    x: RADIO_POSITION[0] + 0.15,
    y: RADIO_POSITION[1] + 0.09,
    z: RADIO_POSITION[2] - 0.055,
  })
  await expect(page.locator('.interaction-hint')).not.toBeVisible()
  expect(recordings).toEqual([])
  await aim('radio-play')
  const before = await snapshot(page)
  const playbackDelay = page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error('Radio never started')),
          10000,
        )
        document.addEventListener(
          'keydown',
          function measure(event) {
            if (event.key.toLowerCase() !== 'e') return
            document.removeEventListener('keydown', measure, true)
            const started = performance.now()
            const sample = () => {
              if (window.__GAME_DEBUG__?.snapshot().radio?.playing) {
                clearTimeout(timeout)
                resolve(performance.now() - started)
              } else requestAnimationFrame(sample)
            }
            requestAnimationFrame(sample)
          },
          true,
        )
      }),
  )
  await page.keyboard.press('e')
  expect(await playbackDelay).toBeGreaterThanOrEqual(490)
  await expect
    .poll(async () => (await snapshot(page)).radio?.playing)
    .toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('radio-physical-press.png'),
  })
  await expect
    .poll(async () => (await snapshot(page)).radio?.pressing)
    .toBeNull()
  const afterPress = await snapshot(page)
  expect(afterPress.cameraPosition).toEqual(before.cameraPosition)
  expect(afterPress.cameraRotation).toEqual(before.cameraRotation)
  for (const [index, track] of RADIO_TRACKS.entries()) {
    if (index) await press('radio-next')
    await expect
      .poll(async () => (await snapshot(page)).radio?.track)
      .toBe(index)
    await expect
      .poll(async () => (await snapshot(page)).radio?.duration ?? 0)
      .toBeGreaterThan(60)
    await expect
      .poll(async () => (await snapshot(page)).radio?.elapsed ?? 0)
      .toBeGreaterThan(0.3)
    expect(recordings).toContain(track.file)
  }
  await press('radio-louder')
  expect((await snapshot(page)).radio?.volume).toBeCloseTo(0.45)
  await press('radio-quieter')
  expect((await snapshot(page)).radio?.volume).toBeCloseTo(0.35)
  await press('radio-play')
  expect((await snapshot(page)).radio?.playing).toBe(false)
  const count = recordings.length
  await press('radio-next')
  expect(recordings).toHaveLength(count)
  await press('radio-previous')
  expect((await snapshot(page)).radio?.track).toBe(4)
  const after = await snapshot(page)
  expect(after.pointerLocked).toBe(true)
  expect(after.cameraPosition).toEqual(before.cameraPosition)
  await expect(page.getByRole('dialog', { name: 'CDS Radio' })).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('radio-in-world.png') })
  await page.goto('/credits.html#music')
  await expect(page.locator('#music article')).toHaveCount(5)
  expect(errors).toEqual([])
})
