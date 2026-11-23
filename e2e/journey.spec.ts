import { BRIDGE_OFFSET_Z } from '../src/game/world/bridgePlacement'
import { expect, test } from '@playwright/test'
import {
  approach,
  forwardStation,
  walkTo,
  approachCrew,
  enterObservationRoom,
  protocol,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

test('completes the recovery journey with contact skipped and the real CV, then starts a new session on refresh', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const errors: string[] = []
  let transmissions = 0
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.route('**/api/contact', (route) => {
    transmissions++
    return route.fulfill({
      status: 500,
      json: { error: 'Unexpected transmission' },
    })
  })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 45_000,
  })
  await approachCrew(page)
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(
    identity.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await page.keyboard.press('e')
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Crew Access' }),
  ).toBeVisible()
  await enterObservationRoom(page)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toBeVisible()
  await page.keyboard.press('t')

  await forwardStation(page, -1)
  await page.keyboard.press('e')
  const archive = page.getByRole('dialog', {
    name: 'Central Archive',
    exact: true,
  })
  await archive
    .getByRole('button', { name: 'Service Record', exact: true })
    .click()
  await expect(
    archive.getByRole('heading', { name: 'Blue Alba' }),
  ).toBeVisible()
  await page.keyboard.press('e')
  await expect(
    page.locator('.interaction-hint').filter({ hasText: 'Use computer' }),
  ).toBeVisible()

  await walkTo(page, -2.4, -1.3 + BRIDGE_OFFSET_Z)
  await walkTo(page, 2.4, -1.3 + BRIDGE_OFFSET_Z)
  await approach(
    page,
    { x: 2.4, y: 1.65, z: -3.715 + BRIDGE_OFFSET_Z },
    'E · Earth Communications',
  )
  await page.keyboard.press('e')
  const communications = page.getByRole('dialog', {
    name: 'Earth Communications',
    exact: true,
  })
  await communications
    .getByRole('button', { name: 'Skip', exact: true })
    .click()
  await expect(
    communications.getByRole('form').getByRole('status'),
  ).toContainText('No message was sent')
  await page.keyboard.press('e')
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: 'Earth Communications' }),
  ).toBeVisible()

  await walkTo(page, 2.4, 3.1 + BRIDGE_OFFSET_Z)
  await approach(
    page,
    { x: 4.55, y: 1.65, z: 2.1 + BRIDGE_OFFSET_Z },
    'E Personal Workstation',
  )
  await page.keyboard.press('e')
  const desktop = page.getByRole('dialog', {
    name: 'Personal Workstation',
    exact: true,
  })
  await desktop
    .getByRole('button', { name: 'Crew Dossier.pdf', exact: true })
    .click()
  const downloaded = page.waitForEvent('download')
  await desktop
    .getByRole('link', { name: 'Download CV (PDF)', exact: true })
    .click()
  expect((await downloaded).suggestedFilename()).toBe(
    'joaquin-pettinari-cv.pdf',
  )
  await page.keyboard.press('e')
  await expect(
    page
      .locator('.interaction-hint')
      .filter({ hasText: 'Personal Workstation' }),
  ).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('4 / 4 complete')
  const completed = (await protocol(page)).completed
  expect(completed).toHaveLength(6)
  expect(completed).toEqual(
    expect.arrayContaining([
      'lighting',
      'tablet',
      'crew',
      'archives',
      'uplink',
      'dossier',
    ]),
  )
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  // Optional portfolio objectives do not prove the future relay repair happened.
  await expect(
    page.locator('[data-dialogue-event="missionComplete"]'),
  ).toHaveCount(0)
  await expect(subtitle).not.toBeVisible({ timeout: 30000 })
  await page.keyboard.press('t')
  await expect(
    page.getByRole('region', { name: 'Held mission tablet' }),
  ).toContainText('Protocol complete')
  await page.waitForTimeout(500)
  await expect(subtitle).not.toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('0 / 4 complete', { timeout: 45_000 })
  expect((await protocol(page)).completed).toEqual(['lighting'])
  expect(transmissions).toBe(0)
  expect(errors).toEqual([])
})
