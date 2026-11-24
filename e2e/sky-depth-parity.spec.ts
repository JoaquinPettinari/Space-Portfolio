import { expect, test } from '@playwright/test'
import type { compareSkyDepthPixels } from './fixtures/skyDepthParity'

test('late sky preserves distant opaque bodies and transparent window pixels', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/credits.html')
  const results = await page.evaluate(async () => {
    const fixturePath = '/e2e/fixtures/skyDepthParity.ts'
    const fixture = (await import(/* @vite-ignore */ fixturePath)) as {
      compareSkyDepthPixels: typeof compareSkyDepthPixels
    }
    return fixture.compareSkyDepthPixels()
  })
  await testInfo.attach('sky-depth-pixel-parity', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  expect(results).toHaveLength(3)
  for (const result of results) {
    expect(result.nonBlackPixels, result.name).toBeGreaterThan(1000)
    expect(result.opaqueBeyondSkyPixels, result.name).toBeGreaterThan(100)
    expect(result.transparentCoveragePixels, result.name).toBeGreaterThan(1000)
    expect(result.maxChannelDelta, result.name).toBeLessThanOrEqual(1)
    expect(result.channelsAboveTolerance, result.name).toBe(0)
  }
  expect(errors).toEqual([])
})
