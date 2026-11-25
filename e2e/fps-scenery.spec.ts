import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { COFFEE_POSITION } from '../src/game/interaction/station'
import {
  approach,
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('profiles the frame and reviews the complete globe, walls and working espresso machine', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const out = 'docs/audits/fps-scenery/after'
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 90_000,
  })
  await enter(page)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.start')
  await page.waitForTimeout(4000)
  const { profile } = await cdp.send('Profiler.stop')
  await writeFile(`${out}/arrival.cpuprofile`, JSON.stringify(profile))
  await cdp.detach()
  const gpu = await page.evaluate(async () => {
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const ext = gl?.getExtension('EXT_disjoint_timer_query_webgl2') as {
      TIME_ELAPSED_EXT: number
      GPU_DISJOINT_EXT: number
    } | null
    if (!gl || !ext) return { supported: false, samplesMs: [] }
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const samplesMs: number[] = []
    for (let i = 0; i < 8; i++) {
      await frame()
      const query = gl.createQuery()!
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query)
      await frame()
      gl.endQuery(ext.TIME_ELAPSED_EXT)
      for (
        let poll = 0;
        poll < 30 && !gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
        poll++
      )
        await frame()
      if (
        gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) &&
        !gl.getParameter(ext.GPU_DISJOINT_EXT)
      )
        samplesMs.push(
          Number(gl.getQueryParameter(query, gl.QUERY_RESULT)) / 1e6,
        )
      gl.deleteQuery(query)
    }
    return { supported: true, samplesMs }
  })
  await writeFile(`${out}/gpu.json`, JSON.stringify(gpu, null, 2))
  console.log('FRAME_GPU', gpu)
  const totals = new Map<number, number>()
  for (let i = 0; i < (profile.samples?.length ?? 0); i++)
    totals.set(
      profile.samples![i],
      (totals.get(profile.samples![i]) ?? 0) + (profile.timeDeltas?.[i] ?? 0),
    )
  console.log(
    'FRAME_CPU',
    JSON.stringify(
      profile.nodes
        .map((n) => ({
          name: n.callFrame.functionName,
          url: n.callFrame.url,
          ms: (totals.get(n.id) ?? 0) / 1000,
        }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 18),
    ),
  )
  await enterObservationRoom(page)
  await walkTo(page, 0, 0.6)
  await lookAt(page, { x: -26, y: -7, z: -62 })
  await page.screenshot({ path: `${out}/complete-earth.png` })
  await lookAt(page, { x: 3.8, y: 2.1, z: 0.5 })
  await page.screenshot({ path: `${out}/pressure-wall.png` })
  await walkTo(page, 3.0, 0.35)
  const [x, y, z] = COFFEE_POSITION
  await approach(page, { x, y, z }, 'E · Brew coffee')
  await page.screenshot({ path: `${out}/espresso-idle.png` })
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await snapshot(page)).session.coffee.phase)
    .toBe('ready')
  await page.screenshot({ path: `${out}/espresso-ready.png` })
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await snapshot(page)).session.coffee.achievement)
    .toBe(true)
  expect(errors).toEqual([])
})
