import { expect, test } from '@playwright/test'
import {
  approach,
  forwardStation,
  walkTo,
  snapshot,
  enter as capture,
  enterObservationRoom,
  lookAt,
  protocol,
} from './helpers/game'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

test('completes the recovery journey with contact skipped and the real CV, then restores progress', async ({
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
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await capture(page)
  await expect
    .poll(async () => (await snapshot(page)).cameraPosition.y)
    .toBeLessThan(1.73)
  await walkTo(page, 0, 7.7)
  await lookAt(page, { x: -1.4, y: 1.65, z: 7.3 })
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  await page.keyboard.press('e')
  const identity = page.getByRole('dialog', {
    name: 'Crew Access',
    exact: true,
  })
  await expect(identity.getByRole('status')).toContainText('ACCESS GRANTED')
  await page.keyboard.press('e')
  await expect(page.getByText('E · Crew Access', { exact: true })).toBeVisible()
  await enterObservationRoom(page)
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  await page
    .getByRole('button', { name: 'Continue Protocol', exact: true })
    .click()
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
    page.getByText('E · Use computer', { exact: true }),
  ).toBeVisible()

  await walkTo(page, -2.4, -1.3)
  await walkTo(page, 2.4, -1.3)
  await approach(
    page,
    { x: 2.4, y: 1.65, z: -3.715 },
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
  await expect(communications.getByRole('status')).toContainText(
    'No message was sent',
  )
  await page.keyboard.press('e')
  await expect(
    page.getByText('E · Earth Communications', { exact: true }),
  ).toBeVisible()

  await walkTo(page, 2.4, 3.1)
  await approach(page, { x: 4.55, y: 1.65, z: 2.1 }, 'E · Personal Workstation')
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
    page.getByText('E · Personal Workstation', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('6 / 6 complete')
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
  await page.keyboard.press('t')
  await page.keyboard.press('r')
  await expect(
    page.getByRole('dialog', { name: 'Mission tablet' }),
  ).toContainText('Protocol complete. Enjoy your stay aboard CRUZ DEL SUR.')
  await page.reload()
  await expect(
    page.getByRole('complementary', { name: 'Recovery objectives' }),
  ).toContainText('6 / 6 complete', { timeout: 45_000 })
  expect((await protocol(page)).completed).toEqual(completed)
  expect(transmissions).toBe(0)
  expect(errors).toEqual([])
})
