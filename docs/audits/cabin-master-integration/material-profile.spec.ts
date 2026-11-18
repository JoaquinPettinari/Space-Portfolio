import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { enter, walkTo, lookAt } from '../../../e2e/helpers/game'
test('profiles cabin materials without changing scene state', async ({
  page,
}) => {
  const label = process.env.CABIN_PROFILE_LABEL ?? 'two-lights'
  if (!/^[a-z-]+$/.test(label)) throw new Error('Invalid label')
  const out = `docs/audits/cabin-master-integration/profile-${label}`
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  await walkTo(page, 0, 15.2)
  await lookAt(page, { x: -4.3, y: 1.5, z: 15.2 })
  const result = await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let i = 0; i < 60; i++) await frame()
    const samples = []
    for (let i = 0; i < 180; i++) {
      await frame()
      if (!window.__GAME_DEBUG__) throw new Error('No diagnostics')
      samples.push(window.__GAME_DEBUG__.performance())
    }
    const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
    return {
      median: times[90],
      p95: times[171],
      samples,
      materials: window.__GAME_DEBUG__!.materialInventory(),
    }
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.start')
  await page.waitForTimeout(4000)
  const { profile } = await cdp.send('Profiler.stop')
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
      const query = gl.createQuery()
      if (!query) throw new Error('GPU query allocation failed')
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
  await writeFile(`${out}.cpuprofile`, JSON.stringify(profile))
  await writeFile(
    `${out}.json`,
    JSON.stringify({ ...result, gpu, errors }, null, 2),
  )
  console.log(
    'PROFILE',
    JSON.stringify({
      median: result.median,
      gpu,
      p95: result.p95,
      sample: result.samples[90],
      materials: result.materials.length,
      missingFastPath: result.materials.filter((m) => !m.fastPath),
    }),
  )
  expect(errors).toEqual([])
})
