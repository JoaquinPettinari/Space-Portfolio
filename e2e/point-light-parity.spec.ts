import { expect, test } from '@playwright/test'
import type { comparePointLightPixels } from './fixtures/pointLightParity'

test('direct-light BRDF guard preserves standard and physical shading pixels', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  // Static page establishes the Vite origin without mounting the game renderer.
  await page.goto('/credits.html')
  const results = await page.evaluate(async () => {
    const fixturePath = '/e2e/fixtures/pointLightParity.ts'
    const fixture = (await import(/* @vite-ignore */ fixturePath)) as {
      comparePointLightPixels: typeof comparePointLightPixels
    }
    return fixture.comparePointLightPixels()
  })
  await testInfo.attach('point-light-pixel-parity', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  expect(results).toHaveLength(5)
  for (const result of results) {
    expect(result.nonBlackPixels, result.name).toBeGreaterThan(100)
    expect(result.maxChannelDelta, result.name).toBeLessThanOrEqual(1)
    expect(result.channelsAboveTolerance, result.name).toBe(0)
  }
  expect(errors).toEqual([])
})
