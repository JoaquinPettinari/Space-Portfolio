import { expect, test } from '@playwright/test'
import { enter } from './helpers/game'

type AudioObservationWindow = Window & {
  __observedCdsAudio?: HTMLAudioElement[]
}

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

test('real CDS-01 media decodes and follows sound, subtitles and Escape', async ({
  page,
}, info) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.addInitScript(() => {
    const observed: HTMLAudioElement[] = []
    ;(window as AudioObservationWindow).__observedCdsAudio = observed
    // Observe native elements only: play, decoding, timing and policy stay real.
    window.Audio = new Proxy(window.Audio, {
      construct(target, args: ConstructorParameters<typeof Audio>) {
        const audio = new target(...args)
        observed.push(audio)
        return audio
      },
    })
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 60_000,
  })

  const media = await page.evaluate(async () => {
    const stems = [
      'welcome_access',
      'access_granted',
      'welcome_bridge',
      'table_result',
      'confirmation_files',
      'communications_restored',
      'missions_completed',
    ]
    const context = new AudioContext()
    try {
      const results = []
      for (const stem of stems) {
        const response = await fetch(`/audio/cds01/IA_dialog_${stem}.mp3`)
        if (!response.ok) throw new Error(`Missing recording: ${stem}`)
        const decoded = await context.decodeAudioData(
          await response.arrayBuffer(),
        )
        results.push({
          stem,
          duration: decoded.duration,
          channels: decoded.numberOfChannels,
        })
      }
      return results
    } finally {
      await context.close()
    }
  })
  expect(media).toHaveLength(7)
  for (const recording of media) {
    expect(recording.duration).toBeGreaterThan(3)
    expect(recording.channels).toBe(1)
  }
  await info.attach('native-audio-decoding', {
    body: JSON.stringify(media, null, 2),
    contentType: 'application/json',
  })

  const voice = () =>
    page.evaluate(() => {
      const audio = (
        window as AudioObservationWindow
      ).__observedCdsAudio?.findLast((element) =>
        element.src.includes('IA_dialog_welcome_access'),
      )
      return audio
        ? {
            time: audio.currentTime,
            paused: audio.paused,
            muted: audio.muted,
            duration: Number.isFinite(audio.duration) ? audio.duration : null,
            error: audio.error?.message ?? null,
          }
        : null
    })
  await enter(page)
  await page.keyboard.press('Escape')
  const pause = page.getByRole('dialog', { name: 'Game paused' })
  await expect(pause).toBeVisible()
  const sound = pause.getByRole('switch', {
    name: 'Ambient sound',
    exact: true,
  })
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'true')
  await enter(page)
  await expect.poll(async () => (await voice())?.time ?? 0).toBeGreaterThan(0.2)
  expect((await voice())?.error).toBeNull()
  await expect(page.locator('[data-dialogue-event="arrival"]')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(pause).toBeVisible()
  await expect.poll(async () => (await voice())?.paused).toBe(true)
  const pausedAt = (await voice())!.time
  await page.waitForTimeout(700)
  expect(Math.abs((await voice())!.time - pausedAt)).toBeLessThan(0.08)

  const subtitles = pause.getByRole('switch', {
    name: 'Subtitles',
    exact: true,
  })
  await subtitles.click()
  await expect(subtitles).toHaveAttribute('aria-checked', 'false')
  await enter(page)
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveCount(0)
  await expect
    .poll(async () => (await voice())?.time ?? 0)
    .toBeGreaterThan(pausedAt + 0.2)

  await page.keyboard.press('Escape')
  await expect(pause).toBeVisible()
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await subtitles.click()
  await enter(page)
  await expect(page.locator('[data-dialogue-event="arrival"]')).toBeVisible()
  await expect
    .poll(async () => {
      const state = await voice()
      return state === null || state.paused || state.muted
    })
    .toBe(true)
  expect(errors).toEqual([])
})
