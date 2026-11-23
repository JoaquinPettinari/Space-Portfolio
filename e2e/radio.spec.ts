import { expect, test } from '@playwright/test'
import { enterObservationRoom, lookAt, snapshot, walkTo } from './helpers/game'
import { RADIO_POSITION } from '../src/game/interaction/station'
import { RADIO_BUTTONS, type RadioAction } from '../src/game/radioControls'
import { RADIO_TRACKS } from '../src/game/radioTracks'
import gestureTiming from '../src/game/world/gestureTiming.json' with { type: 'json' }

// Native Pointer Lock routes capture explicit contact evidence below; tracing
// every WebGL frame adds enough load to disrupt mouse delivery in software GPU runs.
test.use({ screenshot: 'only-on-failure', video: 'off', trace: 'off' })

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
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120_000,
  })
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
    await expect
      .poll(async () => (await snapshot(page)).radio?.pressing)
      .toBe(action)
    await expect
      .poll(async () => (await snapshot(page)).radio?.pressing)
      .toBeNull()
    expect((await snapshot(page)).radio?.actionCommitted).toBe(true)
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
  let measurementReady = () => {}
  const ready = new Promise<void>((resolve) => {
    measurementReady = resolve
  })
  await page.exposeFunction('radioMeasurementReady', () => measurementReady())
  const playbackDelay = page.evaluate(
    () =>
      new Promise<{
        delay: number
        samples: {
          elapsed: number
          gap: number | null
          committed: boolean
          playing: boolean
        }[]
      }>((resolve, reject) => {
        let keyReceived = false
        const samples: {
          elapsed: number
          gap: number | null
          committed: boolean
          playing: boolean
        }[] = []
        const timeout = window.setTimeout(
          () =>
            reject(
              new Error(
                'Radio never started: ' +
                  JSON.stringify({
                    keyReceived,
                    samples,
                    state: window.__GAME_DEBUG__?.snapshot().radio,
                    focused: document.hasFocus(),
                    hidden: document.hidden,
                  }),
              ),
            ),
          10000,
        )
        document.addEventListener(
          'keydown',
          function measure(event) {
            if (event.key.toLowerCase() !== 'e') return
            keyReceived = true
            document.removeEventListener('keydown', measure, true)
            const started = performance.now()
            const sample = () => {
              const radio = window.__GAME_DEBUG__?.snapshot().radio
              if (radio?.gestureElapsed != null)
                samples.push({
                  elapsed: radio.gestureElapsed,
                  gap: radio.fingerButtonGap,
                  committed: radio.actionCommitted,
                  playing: radio.playing,
                })
              if (radio?.playing) {
                clearTimeout(timeout)
                resolve({ delay: performance.now() - started, samples })
              } else requestAnimationFrame(sample)
            }
            requestAnimationFrame(sample)
          },
          true,
        )
        void (
          window as typeof window & {
            radioMeasurementReady: () => Promise<void>
          }
        ).radioMeasurementReady()
      }),
  )
  await ready
  await page.keyboard.press('e')
  const playback = await playbackDelay
  expect(playback.delay).toBeGreaterThanOrEqual(
    gestureTiming.radio.action * 1000 - 10,
  )
  expect(
    playback.samples.some(
      (s) =>
        s.elapsed >= gestureTiming.radio.contact &&
        s.elapsed < gestureTiming.radio.action &&
        s.gap !== null &&
        s.gap < 0.002 &&
        !s.committed &&
        !s.playing,
    ),
  ).toBe(true)
  const actionFrame = playback.samples.find((s) => s.committed)
  expect(actionFrame).toBeDefined()
  expect(actionFrame!.elapsed).toBeGreaterThanOrEqual(
    gestureTiming.radio.action,
  )
  expect(actionFrame!.gap).not.toBeNull()
  expect(actionFrame!.gap!).toBeLessThan(0.002)
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
  await expect
    .poll(async () => (await snapshot(page)).radio?.playing)
    .toBe(false)
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
