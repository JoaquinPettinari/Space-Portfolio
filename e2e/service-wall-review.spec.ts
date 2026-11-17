import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { enter, lookAt, snapshot, walkTo } from './helpers/game'

test('records the service wall and its steady frame costs', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const phase = process.env.SERVICE_WALL_PHASE ?? 'after'
  if (!/^[a-z-]+$/.test(phase)) throw new Error('Invalid service wall phase')
  const out = 'docs/audits/service-wall'
  await mkdir(out, { recursive: true })
  const started = Date.now()
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  const readyMs = Date.now() - started
  await walkTo(page, 0, 15.2)
  await lookAt(page, { x: 4, y: 1.4, z: 15.2 })
  await page.screenshot({ path: `${out}/${phase}.png` })
  const result = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 60; i++) await frame()
    const samples = []
    for (let i = 0; i < 180; i++) {
      await frame()
      const diagnostics = window.__GAME_DEBUG__
      if (!diagnostics) throw new Error('Diagnostics not ready')
      samples.push(diagnostics.performance())
    }
    const canvas = document.querySelector('canvas')
    const gl = canvas?.getContext('webgl2')
    if (!canvas || !gl) throw new Error('WebGL2 canvas not ready')
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    const times = samples.map((sample) => sample.frameMs).sort((a, b) => a - b)
    return {
      userAgent: navigator.userAgent,
      renderer: extension
        ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
        : 'unknown',
      viewport: [innerWidth, innerHeight],
      canvas: [canvas.width, canvas.height],
      deviceDpr: devicePixelRatio,
      medianMs: times[90],
      p95Ms: times[171],
      samples,
    }
  })
  await writeFile(
    `${out}/${phase}.json`,
    JSON.stringify({ ...result, readyMs }, null, 2) + '\n',
  )
  console.log(
    'SERVICE_WALL',
    phase,
    JSON.stringify({ ...result, samples: result.samples[90], readyMs }),
  )
  await info.attach('service-wall', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  })
  await walkTo(page, 1.5, 13.9)
  await lookAt(page, { x: 3.85, y: 1.35, z: 13.9 })
  await page.screenshot({ path: `${out}/${phase}-storage.png` })
  await walkTo(page, 1.5, 16.6)
  await lookAt(page, { x: 3.85, y: 1.35, z: 16.6 })
  await page.screenshot({ path: `${out}/${phase}-life-support.png` })
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
