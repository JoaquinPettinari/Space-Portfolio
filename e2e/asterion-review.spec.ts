import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import {
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

type Startup = {
  firstVideoFrameMs: number | null
  controlsVisibleMs: number | null
  videoFrames: number | null
  videoDropped: number | null
}
declare global {
  interface Window {
    __ASTERION_STARTUP__?: Startup
  }
}

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  screenshot: 'off',
  video: 'off',
  trace: 'off',
})
test.setTimeout(420_000)

function auditDirectory() {
  const collection = process.env.ASTERION_AUDIT ?? 'integration'
  if (!['integration', 'motion'].includes(collection))
    throw new Error('Invalid ASTERION_AUDIT')
  return `docs/audits/asterion-${collection}`
}

async function measure(page: Page) {
  return page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 30; i++) await frame()
    const samples: number[] = []
    for (let i = 0; i < 150; i++) {
      await frame()
      if (!window.__GAME_DEBUG__) throw new Error('Diagnostics unavailable')
      samples.push(window.__GAME_DEBUG__.performance().frameMs)
    }
    const sorted = [...samples].sort((a, b) => a - b)
    const state = window.__GAME_DEBUG__!.snapshot()
    return {
      medianMs: sorted[75],
      p95Ms: sorted[142],
      samples,
      cameraPosition: state.cameraPosition,
      cameraRotation: state.cameraRotation,
      drawCalls: state.drawCalls,
      triangles: state.triangles,
      resources: state.resources,
      renderDpr: state.renderDpr,
      inventory: window.__GAME_DEBUG__!.renderInventory(),
    }
  })
}

test('reviews exterior loading and all principal window directions with native controls', async ({
  page,
}) => {
  const phase = process.env.ASTERION_PHASE ?? 'after'
  if (!['before', 'after'].includes(phase))
    throw new Error('Invalid ASTERION_PHASE')
  const directory = auditDirectory()
  await mkdir(directory, { recursive: true })
  const errors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(3000)
    const data: Startup = {
      firstVideoFrameMs: null,
      controlsVisibleMs: null,
      videoFrames: null,
      videoDropped: null,
    }
    window.__ASTERION_STARTUP__ = data
    let attached = false
    const inspect = () => {
      const video = document.querySelector('video')
      if (video && !attached) {
        attached = true
        video.requestVideoFrameCallback(() => {
          data.firstVideoFrameMs = performance.now()
        })
        video.addEventListener('ended', () => {
          const q = video.getVideoPlaybackQuality()
          data.videoFrames = q.totalVideoFrames
          data.videoDropped = q.droppedVideoFrames
        })
      }
      const controls = document.querySelector('[aria-label="Game controls"]')
      if (
        controls instanceof HTMLElement &&
        controls.offsetWidth > 0 &&
        getComputedStyle(controls).visibility === 'visible' &&
        !document.querySelector('.docking-intro') &&
        data.controlsVisibleMs === null
      )
        data.controlsVisibleMs = performance.now()
    }
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(inspect).observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
      })
      inspect()
    })
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120_000,
  })
  await enter(page)
  const startup = await page.evaluate(() => window.__ASTERION_STARTUP__)
  const views: {
    name: string
    measurement: Awaited<ReturnType<typeof measure>>
  }[] = []
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    views.push({ name, measurement: await measure(page) })
    await page.screenshot({ path: `${directory}/${phase}-${name}.png` })
    await writeFile(
      `${directory}/${phase}-partial.json`,
      JSON.stringify({ startup, views, errors, warnings }, null, 2) + '\n',
    )
  }
  await walkTo(page, 0, 15.15)
  await capture('arrival-port', { x: -8, y: 1.7, z: 15.15 })
  await enterObservationRoom(page)
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, -2.4, -4.35)
  await capture('bow-forward', { x: 0, y: 1.85, z: -12 })
  await capture('bow-port', { x: -8, y: 1.8, z: -4.35 })
  await capture('bow-overhead', { x: -1, y: 10, z: -4.35 })
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, 0, 1.5)
  await walkTo(page, 2.4, -0.05)
  await walkTo(page, 2.4, -4.35)
  await capture('bow-starboard', { x: 8, y: 1.8, z: -4.35 })
  await walkTo(page, 2.4, -0.05)
  await walkTo(page, 0, 1.5)
  await walkTo(page, 0, 8.15)
  await capture('passage-port', { x: -5, y: 1.8, z: 8.15 })
  await capture('passage-starboard', { x: 5, y: 1.8, z: 8.15 })
  await capture('passage-overhead', { x: 1.4, y: 10, z: 8.15 })
  const environment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!
    const gl = canvas.getContext('webgl2')!
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      userAgent: navigator.userAgent,
      renderer: ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : 'unknown',
      viewport: [innerWidth, innerHeight],
      canvas: [canvas.width, canvas.height],
      resources: performance.getEntriesByType('resource').map((entry) => {
        const r = entry as PerformanceResourceTiming
        return {
          path: new URL(r.name).pathname,
          encodedBytes: r.encodedBodySize,
          transferBytes: r.transferSize,
          durationMs: r.duration,
        }
      }),
    }
  })
  const exterior = environment.resources.filter(
    (r) =>
      r.path.startsWith('/textures/solar-system/') ||
      r.path.startsWith('/textures/asterion/') ||
      r.path.includes('/models/asterion'),
  )
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible()
  await page.waitForTimeout(300)
  const pausedFramesBefore = (await snapshot(page)).renderedFrames
  const pausedBefore = (await snapshot(page)).spaceMotion
  await page.waitForTimeout(750)
  const pausedAfter = (await snapshot(page)).spaceMotion
  const pausedFramesAfter = (await snapshot(page)).renderedFrames
  if (phase === 'after') {
    expect(pausedAfter).toEqual(pausedBefore)
    expect(pausedFramesAfter - pausedFramesBefore).toBeLessThanOrEqual(3)
  }
  await page.getByRole('button', { name: 'Resume mission' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  const movingBefore = (await snapshot(page)).spaceMotion
  const activeFramesBefore = (await snapshot(page)).renderedFrames
  await page.waitForTimeout(500)
  const movingAfter = (await snapshot(page)).spaceMotion
  const activeFramesAfter = (await snapshot(page)).renderedFrames
  if (phase === 'after')
    expect(activeFramesAfter - activeFramesBefore).toBeGreaterThan(3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(150)
  const reducedBefore = (await snapshot(page)).spaceMotion
  await page.waitForTimeout(350)
  const reducedAfter = (await snapshot(page)).spaceMotion
  expect(reducedAfter).toEqual(reducedBefore)
  const report = {
    phase,
    startup,
    views,
    environment,
    exterior,
    exteriorEncodedBytes: exterior.reduce((sum, r) => sum + r.encodedBytes, 0),
    errors,
    warnings,
    motion: {
      pausedFramesBefore,
      pausedFramesAfter,
      activeFramesBefore,
      activeFramesAfter,
      pausedBefore,
      pausedAfter,
      movingBefore,
      movingAfter,
      reducedBefore,
      reducedAfter,
    },
  }
  await writeFile(
    `${directory}/${phase}.json`,
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(
    'ASTERION_REVIEW',
    JSON.stringify({
      phase,
      startup,
      exteriorEncodedBytes: report.exteriorEncodedBytes,
      views: views.map((v) => ({
        name: v.name,
        medianMs: v.measurement.medianMs,
        p95Ms: v.measurement.p95Ms,
        drawCalls: v.measurement.drawCalls,
        triangles: v.measurement.triangles,
        resources: v.measurement.resources,
      })),
    }),
  )
  expect(errors).toEqual([])
})

test('measures dedicated cold startup until the intro is gone and controls are visible', async ({
  page,
}) => {
  const phase = process.env.ASTERION_PHASE ?? 'after'
  if (!['before', 'after'].includes(phase))
    throw new Error('Invalid ASTERION_PHASE')
  const directory = auditDirectory()
  await mkdir(directory, { recursive: true })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.addInitScript(() => {
    const data: Startup = {
      firstVideoFrameMs: null,
      controlsVisibleMs: null,
      videoFrames: null,
      videoDropped: null,
    }
    window.__ASTERION_STARTUP__ = data
    let attached = false
    document.addEventListener('DOMContentLoaded', () => {
      const observe = () => {
        const video = document.querySelector('video')
        if (video && !attached) {
          attached = true
          video.requestVideoFrameCallback(() => {
            data.firstVideoFrameMs = performance.now()
          })
          video.addEventListener('ended', () => {
            const q = video.getVideoPlaybackQuality()
            data.videoFrames = q.totalVideoFrames
            data.videoDropped = q.droppedVideoFrames
          })
        }
      }
      new MutationObserver(observe).observe(document.documentElement, {
        subtree: true,
        childList: true,
      })
      observe()
    })
  })
  await page.goto('/')
  await expect(page.locator('.docking-intro')).toHaveCount(0, {
    timeout: 120_000,
  })
  await expect(page.getByLabel('Game controls')).toBeVisible()
  const result = await page.evaluate(() => ({
    ...window.__ASTERION_STARTUP__,
    controlsVisibleMs: performance.now(),
  }))
  await writeFile(
    `${directory}/${phase}-startup.json`,
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log('ASTERION_COLD_STARTUP', JSON.stringify({ phase, ...result }))
  expect(result.videoFrames).toBe(240)
  expect(result.firstVideoFrameMs).not.toBeNull()
})
