import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom } from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

const errors = new WeakMap<Page, string[]>()
async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_DEBUG__) throw new Error('Diagnostics not ready')
    return window.__GAME_DEBUG__.snapshot()
  })
}
async function openWorkstation(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Mission tablet · T' }),
  ).toBeVisible({ timeout: 45_000 })
  await enterObservationRoom(page)
  // Lit observation room, facing forward after the real airlock walkthrough.
  // These host samples are observations, not a frame-rate acceptance claim.
  const samples: GameSnapshot[] = []
  for (let i = 0; i < 15; i++) {
    samples.push(await snapshot(page))
    await page.waitForTimeout(50)
  }
  await test.info().attach('lit-room-observations', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  })
  await page.mouse.move(640, 360)
  const { cameraPosition: p, cameraRotation: q } = await snapshot(page)
  const yaw = Math.atan2(
    2 * (q.x * q.z + q.y * q.w),
    1 - 2 * (q.x * q.x + q.y * q.y),
  )
  const pitch = Math.asin(
    Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z))),
  )
  const desiredYaw = Math.atan2(p.x - 3.25, p.z - 4.65)
  const desiredPitch = Math.atan2(
    1.65 - p.y,
    Math.hypot(3.25 - p.x, 4.65 - p.z),
  )
  const yawDelta = Math.atan2(
    Math.sin(desiredYaw - yaw),
    Math.cos(desiredYaw - yaw),
  )
  await page.mouse.move(
    640 - yawDelta / 0.002,
    360 - (desiredPitch - pitch) / 0.002,
    { steps: 16 },
  )
  await page.keyboard.down('w')
  await expect(
    page.getByText('E · Personal Workstation', { exact: true }),
  ).toBeVisible()
  await page.keyboard.up('w')
  await page.keyboard.press('e')
  const desktop = page.getByRole('dialog', {
    name: 'Personal Workstation',
    exact: true,
  })
  await expect(desktop).toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  return desktop
}
test.beforeEach(({ page }) => {
  const collected: string[] = []
  errors.set(page, collected)
  page.on('pageerror', (error) => collected.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') collected.push(message.text())
  })
})
test.afterEach(async ({ page }, info) => {
  await info.attach('browser-errors', {
    body: JSON.stringify(errors.get(page)),
    contentType: 'application/json',
  })
  expect(errors.get(page)).toEqual([])
})

test('keyboard desktop opens optional apps and downloads the real dossier without tutorial objectives', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const desktop = await openWorkstation(page)
  await expect(
    desktop.getByRole('heading', { name: 'Personal Workstation', exact: true }),
  ).toBeInViewport()
  await expect(
    desktop.getByRole('button', { name: 'Leave terminal' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  const dossier = desktop.getByRole('button', {
    name: 'Crew Dossier.pdf',
    exact: true,
  })
  await expect(dossier).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(
    desktop.getByRole('button', { name: 'Project Gallery', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(
    desktop.getByRole('button', { name: 'Leave terminal' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    desktop.getByRole('button', { name: 'Project Gallery', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(
    desktop.getByRole('heading', { name: 'Project Gallery', exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'artifacts/personal-workstation-desktop.png' })
  const galleryImage = desktop.locator('.personal-desktop-gallery img')
  await galleryImage.scrollIntoViewIfNeeded()
  await expect(galleryImage).toBeInViewport()
  await page.screenshot({ path: 'artifacts/personal-workstation-gallery.png' })
  await page.keyboard.press('Escape')
  await expect(desktop).toBeVisible()
  await expect(
    desktop.getByRole('heading', { name: 'Project Gallery', exact: true }),
  ).not.toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')
  await expect(
    desktop.getByRole('heading', { name: 'Crew Dossier.pdf', exact: true }),
  ).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await desktop.getByRole('link', { name: 'Download CV (PDF)' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('joaquin-pettinari-cv.pdf')
  const path = await download.path()
  if (!path) throw new Error('Download did not finish')
  const pdf = await readFile(path)
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdf.length).toBeGreaterThan(1000)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cruz-del-sur.protocol') ?? '{}')
            .completed,
      ),
    )
    .toEqual(['lighting', 'dossier'])
  await page.keyboard.press('Escape')
  await expect(desktop).toBeVisible()
  await expect(dossier).toBeFocused()
  await page.keyboard.press('e')
  await expect(desktop).not.toBeVisible()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
})

test('single-click desktop allows explicitly skipping the dossier without downloading it', async ({
  page,
}) => {
  test.setTimeout(90_000)
  let downloads = 0
  page.on('download', () => downloads++)
  const desktop = await openWorkstation(page)
  await desktop
    .getByRole('button', { name: 'Station Settings', exact: true })
    .click()
  await expect(
    desktop.getByRole('heading', { name: 'Comfort and accessibility' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await desktop
    .getByRole('button', { name: 'Crew Dossier.pdf', exact: true })
    .click()
  await desktop.getByRole('button', { name: 'Skip dossier objective' }).click()
  await expect(desktop.getByRole('status')).toContainText(
    'Dossier objective skipped',
  )
  await expect(
    desktop.getByRole('link', { name: 'Download CV (PDF)' }),
  ).toBeVisible()
  expect(downloads).toBe(0)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cruz-del-sur.protocol') ?? '{}')
            .completed,
      ),
    )
    .toEqual(['lighting', 'dossier'])
  await page.keyboard.press('Escape')
  await expect(desktop).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(desktop).not.toBeVisible()
  await expect
    .poll(async () => (await snapshot(page)).pointerLocked)
    .toBe(false)
})
