import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { enter, lookAt, snapshot, walkTo } from './helpers/game'

test('records cabin reference lighting and steady frame costs', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const label = process.env.CABIN_REVIEW_PHASE ?? 'after'
  if (!/^[a-z-]+$/.test(label)) throw new Error('Invalid review phase')
  const out = 'docs/audits/cabin-reference'
  await mkdir(out, { recursive: true })
  const started = Date.now()
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  const readyMs = Date.now() - started
  await walkTo(page, 0, 15.05)
  await lookAt(page, { x: -3.7, y: 1.45, z: 15.75 })
  await page.screenshot({ path: `${out}/${label}.png` })
  const result = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 60; i++) await frame()
    const samples = []
    for (let i = 0; i < 180; i++) {
      await frame()
      samples.push(window.__GAME_DEBUG__!.performance())
    }
    const canvas = document.querySelector('canvas')!
    const gl = canvas.getContext('webgl2')!
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
    `${out}/${label}.json`,
    JSON.stringify({ ...result, readyMs }, null, 2) + '\n',
  )
  console.log(
    'CABIN_REFERENCE',
    label,
    JSON.stringify({ ...result, samples: result.samples[90], readyMs }),
  )
  await info.attach('cabin-reference', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  })
  await walkTo(page, 1.1, 15.2)
  await lookAt(page, { x: -3.7, y: 1.5, z: 15.6 })
  await page.screenshot({ path: `${out}/${label}-wide.png` })
  await lookAt(page, { x: -0.8, y: 0.05, z: 16.4 })
  await page.screenshot({ path: `${out}/${label}-floor.png` })
  await walkTo(page, 0, 16.15)
  await lookAt(page, { x: -2.17, y: 1.3, z: 17.85 })
  await page.screenshot({ path: `${out}/${label}-suit.png` })
  expect((await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
})
