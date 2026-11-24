import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { enter, enterObservationRoom, lookAt, walkTo } from './helpers/game'
import { measureFrames } from './helpers/performance'

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  screenshot: 'off',
  video: 'off',
  trace: 'off',
})
test.setTimeout(420_000)

test('measures GPU draw costs at native arrival, bridge and passage poses', async ({
  page,
}) => {
  const phase = process.env.GPU_COST_PHASE ?? 'before'
  if (!['before', 'after', 'depth', 'fps-before', 'fps-after'].includes(phase))
    throw new Error('Invalid GPU_COST_PHASE')
  const timing = !phase.startsWith('fps-')
  const directory = 'docs/audits/gpu-cost'
  await mkdir(directory, { recursive: true })
  const errors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  })
  await page.goto(timing ? '/?gpuProfile' : '/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 120_000,
  })
  await enter(page)
  const views: object[] = []
  const capture = async (
    name: string,
    target: { x: number; y: number; z: number },
  ) => {
    await lookAt(page, target)
    const started = await page.evaluate(() => performance.now())
    const trials = []
    for (let trial = 0; trial < 3; trial++)
      trials.push(await measureFrames(page))
    const gpu = await page.evaluate((since) => {
      const result = window.__GAME_DEBUG__!.gpu()
      return (
        result && {
          ...result,
          samples: result.samples.filter((sample) => sample.at >= since),
        }
      )
    }, started)
    if (timing) {
      expect(gpu?.supported, 'GPU timer queries must be available').toBe(true)
      expect(
        gpu?.samples.filter((sample) => sample.name === 'FRAME').length,
      ).toBeGreaterThan(10)
      if (phase === 'depth' && name === 'arrival-port')
        expect(
          gpu?.samples.some((sample) =>
            sample.name.endsWith(':opaque-depth-proxy'),
          ),
        ).toBe(true)
    } else expect(gpu).toBeNull()
    await page.screenshot({
      path: directory + '/' + phase + '-' + name + '.png',
    })
    views.push({ name, trials, gpu })
    await writeFile(
      directory + '/' + phase + '-partial.json',
      JSON.stringify({ phase, views, errors, warnings }, null, 2),
    )
    console.log(
      'GPU_VIEW',
      name,
      trials.map((trial) => trial.medianMs),
    )
  }
  await walkTo(page, 0, 15.15)
  await capture('arrival-port', { x: -8, y: 1.7, z: 15.15 })
  await enterObservationRoom(page)
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, -2.4, -4.35)
  await capture('bow-forward', { x: 0, y: 1.85, z: -12 })
  await walkTo(page, -2.4, -0.05)
  await walkTo(page, 0, 1.5)
  await walkTo(page, 0, 8.15)
  await capture('passage-port', { x: -5, y: 1.8, z: 8.15 })
  await writeFile(
    directory + '/' + phase + '.json',
    JSON.stringify({ phase, views, errors, warnings }, null, 2),
  )
  expect(errors).toEqual([])
})
