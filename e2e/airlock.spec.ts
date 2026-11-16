import { expect, test } from '@playwright/test'
import { PLAYER_SPAWN_POSITION } from '../src/game/player/jump'
import { enterObservationRoom, protocol, snapshot } from './helpers/game'

test('arrival starts powered, identification opens access, and refresh starts a fresh session', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const expectFreshArrival = async () => {
    await expect(page.getByLabel('Game controls')).toBeVisible({
      timeout: 60_000,
    })
    const state = await snapshot(page)
    expect(state.cameraPosition.z).toBeCloseTo(PLAYER_SPAWN_POSITION[2], 1)
    expect(state.pointerLocked).toBe(false)
    expect(state.session.bulkheadPhase).toBe('closed')
    expect(state.session.protocol.completed).toEqual(['lighting'])
    expect(state.session.protocol.guidance).toBe('pending')
    expect(state.cabinLighting.ambientIntensity).toBeGreaterThan(0)
    await expect(
      page.getByRole('complementary', { name: 'Recovery objectives' }),
    ).toContainText('0 / 4 complete')
    await expect(
      page.locator('.interaction-hint').filter({ hasText: 'Restore lighting' }),
    ).toHaveCount(0)
  }
  await page.goto('/')
  await expectFreshArrival()
  await enterObservationRoom(page)
  expect((await protocol(page)).completed).toContain('crew')
  expect((await snapshot(page)).session.bulkheadPhase).toBe('open')
  await page.reload()
  await expectFreshArrival()
  expect(errors).toEqual([])
})
