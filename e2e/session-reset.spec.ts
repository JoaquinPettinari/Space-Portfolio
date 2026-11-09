import { expect, test, type Page } from '@playwright/test'
import {
  approach,
  enterObservationRoom,
  protocol,
  snapshot,
  walkTo,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })
test.setTimeout(180_000)

async function ready(page: Page) {
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 60000 })
}

async function expectFreshSession(page: Page) {
  const state = await snapshot(page)
  expect(state.session.protocol.completed).toEqual([])
  expect(state.session.protocol.guidance).toBe('pending')
  expect(state.session.bulkheadOpen).toBe(false)
  expect(state.session.identity).toBe('idle')
  expect(state.session.coffee).toEqual({
    phase: 'idle',
    cups: 0,
    achievement: false,
  })
  expect(state.cameraPosition.z).toBeCloseTo(7, 1)
  expect(state.cabinLighting.ambientIntensity).toBe(0.25)
  expect(
    await page.evaluate(() => ({
      protocol: localStorage.getItem('cruz-del-sur.protocol'),
      coffee: localStorage.getItem('cruz-del-sur.coffee'),
      preference: localStorage.getItem('test-unrelated-preference'),
    })),
  ).toEqual({ protocol: null, coffee: null, preference: 'keep-me' })
}

test('refresh resets actual gameplay and ignores legacy saved progress without deleting unrelated preferences', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  // Old saved data is deliberately seeded only to prove it cannot unlock gameplay.
  // Actual progress below is earned with native movement and interaction input.
  await page.addInitScript(() => {
    localStorage.setItem(
      'cruz-del-sur.protocol',
      JSON.stringify({
        version: 1,
        completed: [
          'lighting',
          'tablet',
          'crew',
          'archives',
          'uplink',
          'dossier',
        ],
        guidance: 'skipped',
      }),
    )
    localStorage.setItem('cruz-del-sur.coffee', '1')
    localStorage.setItem('test-unrelated-preference', 'keep-me')
  })
  await page.goto('/')
  await ready(page)
  await expectFreshSession(page)
  await enterObservationRoom(page)
  expect((await snapshot(page)).session.bulkheadOpen).toBe(true)
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  await page.getByRole('button', { name: 'Skip Tutorial', exact: true }).click()
  await page.keyboard.press('t')
  expect((await protocol(page)).guidance).toBe('skipped')
  expect((await protocol(page)).completed).toEqual(['lighting', 'tablet'])
  await walkTo(page, -2.4, 3.1)
  await approach(page, { x: -4.25, y: 1.2, z: 3.65 }, 'E · Brew coffee')
  await page.keyboard.press('e')
  await expect(
    page.getByText('E · Drink coffee', { exact: true }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect
    .poll(async () => (await snapshot(page)).session.coffee.achievement)
    .toBe(true)
  expect(
    await page.evaluate(() => localStorage.getItem('cruz-del-sur.protocol')),
  ).toBeNull()
  expect(
    await page.evaluate(() => localStorage.getItem('cruz-del-sur.coffee')),
  ).toBeNull()
  await page.reload()
  await ready(page)
  await expectFreshSession(page)
  expect(errors).toEqual([])
})
