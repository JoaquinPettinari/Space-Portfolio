import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { enterObservationRoom, approach, walkTo } from './helpers/game'
import type { GameSnapshot } from '../src/game/debug/GameDiagnostics'

test.use({ screenshot: 'off', video: 'off', trace: 'off' })

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
  await walkTo(page, 3.2, 3.1)
  await approach(page, { x: 4.55, y: 1.65, z: 2.1 }, 'E · Personal Workstation')
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
  const galleryImage = desktop.locator('.personal-desktop-gallery img')
  await galleryImage.scrollIntoViewIfNeeded()
  await expect(galleryImage).toBeInViewport()
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
