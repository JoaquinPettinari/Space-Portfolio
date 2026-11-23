import { expect, test, type Page } from '@playwright/test'
import { enter, snapshot } from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
test.setTimeout(180_000)

type IntroObservation = {
  phases: string[]
  prematureWelcome: boolean
  arrivalMounts: number
  opening: { left: number; right: number; width: number }[]
  firstVideoFrame: { presentationTime: number; mediaTime: number } | null
  lastPresentedFrames: number
  mediaEnded: boolean
  mediaQuality: { total: number; dropped: number } | null
  mediaMetadata: {
    source: string
    duration: number
    width: number
    height: number
  } | null
  mediaEvents: {
    type: string
    mediaTime: number
    duration: number
    ended: boolean
    paused: boolean
    createdAt: number
    deliveredAt: number
    phase: string | undefined
  }[]
  mediaSamples: {
    at: number
    mediaTime: number
    presented: number
    total: number
    dropped: number
  }[]
  unexpectedMediaStops: string[]
  gameRequests: { url: string; startTime: number }[]
  canvasLeaks: string[]
  hiddenCanvasSamples: number
  videoElements: number
  posterLoaded: boolean
}
type ObservedWindow = Window & { __dockingObservation: IntroObservation }

/** Observe rendered DOM only; no game state changes or readiness bypasses. */
async function observeIntro(page: Page) {
  await page.addInitScript(() => {
    const data: IntroObservation = {
      phases: [],
      prematureWelcome: false,
      arrivalMounts: 0,
      opening: [],
      firstVideoFrame: null,
      lastPresentedFrames: 0,
      mediaEnded: false,
      mediaQuality: null,
      mediaMetadata: null,
      mediaEvents: [],
      mediaSamples: [],
      unexpectedMediaStops: [],
      gameRequests: [],
      canvasLeaks: [],
      hiddenCanvasSamples: 0,
      videoElements: 0,
      posterLoaded: false,
    }
    ;(window as unknown as ObservedWindow).__dockingObservation = data
    let previousArrival = false
    const observedVideos = new WeakSet<HTMLVideoElement>()
    const phaseNow = () =>
      document.querySelector<HTMLElement>('[data-intro-phase]')?.dataset
        .introPhase
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (/\/src\/game\/Game\.tsx(?:\?|$)/.test(entry.name))
          data.gameRequests.push({
            url: entry.name,
            startTime: entry.startTime,
          })
      }
    }).observe({ type: 'resource', buffered: true })
    const read = () => {
      const intro = document.querySelector<HTMLElement>('[data-intro-phase]')
      const phase = intro?.dataset.introPhase
      if (phase && data.phases.at(-1) !== phase) data.phases.push(phase)
      const arrival = document.querySelector<HTMLElement>(
        '[data-dialogue-event="arrival"]',
      )
      const visibleArrival = !!arrival?.getClientRects().length
      if (visibleArrival && !previousArrival) data.arrivalMounts += 1
      previousArrival = visibleArrival
      if (intro && visibleArrival) data.prematureWelcome = true
      const poster = intro?.querySelector<HTMLImageElement>(
        '.docking-intro__poster',
      )
      if (poster?.complete && poster.naturalWidth > 0) data.posterLoaded = true
      const video = intro?.querySelector<HTMLVideoElement>(
        '.docking-intro__video',
      )
      if (video && !observedVideos.has(video)) {
        observedVideos.add(video)
        data.videoElements += 1
        const presented: VideoFrameRequestCallback = (_now, metadata) => {
          data.mediaMetadata ??= {
            source: new URL(video.currentSrc).pathname,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          }
          data.firstVideoFrame ??= {
            presentationTime: metadata.presentationTime,
            mediaTime: metadata.mediaTime,
          }
          data.lastPresentedFrames = metadata.presentedFrames
          if (
            Math.floor(metadata.mediaTime) !==
            Math.floor(data.mediaSamples.at(-1)?.mediaTime ?? -1)
          ) {
            const quality = video.getVideoPlaybackQuality()
            data.mediaSamples.push({
              at: performance.now(),
              mediaTime: metadata.mediaTime,
              presented: metadata.presentedFrames,
              total: quality.totalVideoFrames,
              dropped: quality.droppedVideoFrames,
            })
          }
          if (video.isConnected && !video.ended)
            video.requestVideoFrameCallback(presented)
        }
        video.requestVideoFrameCallback(presented)
        for (const event of [
          'playing',
          'waiting',
          'stalled',
          'pause',
          'ended',
        ]) {
          video.addEventListener(event, (nativeEvent) => {
            const phase = phaseNow()
            data.mediaEvents.push({
              type: event,
              mediaTime: video.currentTime,
              duration: video.duration,
              ended: video.ended,
              paused: video.paused,
              createdAt: nativeEvent.timeStamp,
              deliveredAt: performance.now(),
              phase,
            })
            if (
              data.firstVideoFrame &&
              nativeEvent.timeStamp >= data.firstVideoFrame.presentationTime &&
              phase === 'cinematic' &&
              (['waiting', 'stalled'].includes(event) ||
                (event === 'pause' && !video.ended))
            )
              data.unexpectedMediaStops.push(event)
            if (event === 'ended') {
              data.mediaEnded = true
              const quality = video.getVideoPlaybackQuality()
              data.mediaQuality = {
                total: quality.totalVideoFrames,
                dropped: quality.droppedVideoFrames,
              }
            }
          })
        }
      }
    }
    new MutationObserver(read).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-intro-phase', 'data-dialogue-event'],
    })
    const frame = () => {
      read()
      const phase = phaseNow()
      if (
        phase &&
        [
          'loading-exterior',
          'cinematic',
          'fading',
          'waiting-interior',
        ].includes(phase)
      ) {
        for (const canvas of document.querySelectorAll('canvas')) {
          const visibility = getComputedStyle(canvas).visibility
          if (visibility === 'hidden') data.hiddenCanvasSamples += 1
          else data.canvasLeaks.push(`${phase}:${visibility}`)
        }
      }
      if (phase === 'revealing') {
        const panels = document.querySelectorAll('.docking-intro__panel')
        if (panels.length === 2)
          data.opening.push({
            left: panels[0].getBoundingClientRect().right,
            right: panels[1].getBoundingClientRect().left,
            width: innerWidth,
          })
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
}

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('docks, opens from the center, welcomes once and accepts native controls', async ({
  page,
}) => {
  const errors = watchErrors(page)
  await observeIntro(page)
  await page.goto('/')
  const intro = page.locator('[data-intro-phase]')
  await expect(intro).toHaveAttribute('data-intro-phase', 'cinematic', {
    timeout: 90_000,
  })
  await expect(page.getByLabel('Game controls')).not.toBeVisible()
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).not.toBeVisible()
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  )
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await expect(intro).toHaveCount(0)
  const viewport = page.viewportSize()!
  const canvasBounds = await page.locator('canvas').boundingBox()
  expect(canvasBounds?.height).toBeGreaterThan(viewport.height * 0.95)
  expect(canvasBounds?.width).toBeGreaterThan(viewport.width * 0.95)
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'arrival')
  const observed = await page.evaluate(
    () => (window as unknown as ObservedWindow).__dockingObservation,
  )
  await test.info().attach('media-observation', {
    body: JSON.stringify(observed),
    contentType: 'application/json',
  })
  console.log(
    'DOCKING_MEDIA_DETAIL',
    JSON.stringify({
      firstFrame: observed.firstVideoFrame,
      gameRequests: observed.gameRequests,
      mediaEvents: observed.mediaEvents,
      samples: observed.mediaSamples,
      quality: observed.mediaQuality,
      metadata: observed.mediaMetadata,
      canvasLeaks: observed.canvasLeaks,
      hiddenCanvasSamples: observed.hiddenCanvasSamples,
    }),
  )
  expect(observed.phases).toEqual(
    expect.arrayContaining(['cinematic', 'fading', 'revealing']),
  )
  expect(observed.firstVideoFrame).not.toBeNull()
  expect(observed.gameRequests).toHaveLength(1)
  expect(observed.gameRequests[0].startTime).toBeGreaterThanOrEqual(
    observed.firstVideoFrame!.presentationTime,
  )
  expect(observed.mediaEnded).toBe(true)
  expect(observed.mediaMetadata).toEqual({
    source: '/video/circular-arrival-intro.mp4',
    duration: 8,
    width: 1280,
    height: 720,
  })
  expect(observed.mediaQuality?.total).toBeGreaterThanOrEqual(200)
  expect(observed.lastPresentedFrames).toBeGreaterThan(120)
  expect(
    observed.mediaQuality!.dropped / observed.mediaQuality!.total,
  ).toBeLessThan(0.25)
  expect(observed.unexpectedMediaStops).toEqual([])
  expect(observed.hiddenCanvasSamples).toBeGreaterThan(0)
  expect(observed.canvasLeaks).toEqual([])
  console.log(
    'DOCKING_MEDIA_PLAYBACK',
    JSON.stringify({
      firstPresentation: observed.firstVideoFrame!.presentationTime,
      gameRequest: observed.gameRequests[0].startTime,
      lastPresentedFrames: observed.lastPresentedFrames,
      quality: observed.mediaQuality,
      hiddenCanvasSamples: observed.hiddenCanvasSamples,
    }),
  )
  expect(observed.prematureWelcome).toBe(false)
  expect(observed.arrivalMounts).toBe(1)
  expect(observed.opening.length).toBeGreaterThan(1)
  for (const sample of observed.opening) {
    expect(
      Math.abs((sample.left + sample.right) / 2 - sample.width / 2),
    ).toBeLessThan(2)
  }
  expect(
    Math.max(
      ...observed.opening.map(
        (sample) => (sample.right - sample.left) / sample.width,
      ),
    ),
  ).toBeGreaterThan(0.5)
  await subtitle.getByRole('button', { name: 'Dismiss message' }).click()
  await enter(page)
  expect((await snapshot(page)).pointerLocked).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible()
  await page
    .getByRole('button', { name: 'Resume mission', exact: true })
    .click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await expect(intro).toHaveCount(0)
  await expect(subtitle).not.toBeVisible()
  expect(errors).toEqual([])
})

for (const pendingAsset of [
  'cabin-master-static.glb',
  'asterion-worlds.glb.gz',
]) {
  test(`keeps the black gate closed while required asset ${pendingAsset} is pending`, async ({
    page,
  }) => {
    const errors = watchErrors(page)
    await observeIntro(page)
    let release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let held = false
    let releaseGame = () => {}
    const gameGate = new Promise<void>((resolve) => {
      releaseGame = resolve
    })
    let gameRequested = false
    await page.route('**/src/game/Game.tsx*', async (route) => {
      gameRequested = true
      await gameGate
      await route.continue()
    })
    await page.route(`**/models/${pendingAsset}`, async (route) => {
      held = true
      await gate
      await route.continue()
    })
    try {
      await page.goto('/')
      const intro = page.locator('[data-intro-phase]')
      await expect(intro).toHaveAttribute('data-intro-phase', 'cinematic', {
        timeout: 90_000,
      })
      await expect.poll(() => gameRequested).toBe(true)
      // The interior module is still downloading. Deliberately block JS, not the
      // video/decoder APIs, to detect a cinematic clock tied to rAF or capped delta.
      const playback = await page.evaluate(async () => {
        const video = document.querySelector<HTMLVideoElement>(
          '.docking-intro__video',
        )!
        const before = {
          time: video.currentTime,
          frames: video.getVideoPlaybackQuality().totalVideoFrames,
        }
        const started = performance.now()
        while (performance.now() - started < 550) {
          /* test-only main-thread stall */
        }
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
        return {
          before,
          after: {
            time: video.currentTime,
            frames: video.getVideoPlaybackQuality().totalVideoFrames,
          },
          elapsedMs: performance.now() - started,
          paused: video.paused,
        }
      })
      expect(playback.paused).toBe(false)
      expect(playback.after.time - playback.before.time).toBeGreaterThan(0.35)
      expect(playback.after.frames).toBeGreaterThan(playback.before.frames)
      console.log('DOCKING_MEDIA_STALL', JSON.stringify(playback))
      releaseGame()
      await expect(intro).toHaveAttribute(
        'data-intro-phase',
        'waiting-interior',
        {
          timeout: 90_000,
        },
      )
      expect(held).toBe(true)
      await expect(page.locator('canvas')).toHaveCSS('visibility', 'hidden')
      await expect(
        page.getByText('INITIALIZING SYSTEMS', { exact: true }),
      ).toBeVisible()
      await page.keyboard.press('w')
      await page.keyboard.press('e')
      await expect(page.getByLabel('Game controls')).not.toBeVisible()
      await expect(
        page.getByRole('dialog', { name: 'Crew Access' }),
      ).not.toBeVisible()
      await expect(
        page.getByRole('status', { name: 'Station assistant' }),
      ).not.toBeVisible()
      await expect(intro).toHaveAttribute(
        'data-intro-phase',
        'waiting-interior',
      )
      release()
      await expect(page.getByLabel('Game controls')).toBeVisible({
        timeout: 90_000,
      })
      await expect(intro).toHaveCount(0)
      await expect(
        page.getByRole('status', { name: 'Station assistant' }),
      ).toHaveAttribute('data-dialogue-event', 'arrival')
      const observed = await page.evaluate(
        () => (window as unknown as ObservedWindow).__dockingObservation,
      )
      await test.info().attach('media-observation', {
        body: JSON.stringify(observed),
        contentType: 'application/json',
      })
      console.log(
        'DOCKING_MEDIA_SLOW_DETAIL',
        JSON.stringify({
          mediaEvents: observed.mediaEvents,
          samples: observed.mediaSamples,
          quality: observed.mediaQuality,
          canvasLeaks: observed.canvasLeaks,
        }),
      )
      expect(observed.canvasLeaks).toEqual([])
      expect(observed.unexpectedMediaStops).toEqual([])
      expect(errors).toEqual([])
    } finally {
      releaseGame()
      release()
    }
  })
}

test('a failed critical download exposes recovery instead of an endless black screen', async ({
  page,
}) => {
  await page.route('**/models/cabin-master-static.glb', (route) =>
    route.abort('failed'),
  )
  await page.goto('/')
  await expect(page.getByText(/The station could not load/)).toBeVisible({
    timeout: 90_000,
  })
  await expect(
    page.getByRole('button', { name: 'Reload station', exact: true }),
  ).toBeVisible()
  const quick = page.getByRole('button', {
    name: 'Quick Portfolio Access',
    exact: true,
  })
  await expect(quick).toBeVisible()
  await quick.click()
  await expect(
    page.getByRole('heading', { name: 'Joaquín Pettinari', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download CV (PDF)', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Back to station', exact: true })
    .click()
  await page.unroute('**/models/cabin-master-static.glb')
  const recoveryErrors = watchErrors(page)
  await page
    .getByRole('button', { name: 'Reload station', exact: true })
    .click()
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await expect(page.locator('[data-intro-phase]')).toHaveCount(0)
  await expect(
    page.getByRole('status', { name: 'Station assistant' }),
  ).toHaveAttribute('data-dialogue-event', 'arrival')
  expect(recoveryErrors).toEqual([])
})

test('reduced motion completes without sound and preserves the welcome subtitles', async ({
  page,
}) => {
  const errors = watchErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await observeIntro(page)
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await expect(page.locator('[data-intro-phase]')).toHaveCount(0)
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  await expect(subtitle).toHaveAttribute('data-dialogue-event', 'arrival')
  await expect(subtitle).toHaveAttribute('data-speaking', 'false')
  const observed = await page.evaluate(
    () => (window as unknown as ObservedWindow).__dockingObservation,
  )
  expect(observed.prematureWelcome).toBe(false)
  expect(observed.arrivalMounts).toBe(1)
  expect(observed.videoElements).toBe(0)
  expect(observed.firstVideoFrame).toBeNull()
  expect(observed.posterLoaded).toBe(true)
  expect(observed.canvasLeaks).toEqual([])
  expect(errors).toEqual([])
})
