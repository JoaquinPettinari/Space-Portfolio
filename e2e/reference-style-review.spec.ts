import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  PERSONAL_POSITION,
  RADIO_POSITION,
} from '../src/game/interaction/station'
import {
  approach,
  approachCrew,
  enter,
  enterObservationRoom,
  lookAt,
  snapshot,
  walkTo,
} from './helpers/game'

test('reviews reference styling, shared gloves, arrival outfitting and radio through native interaction', async ({
  page,
}) => {
  test.setTimeout(240000)
  const out = 'docs/audits/reference-style'
  await mkdir(out, { recursive: true })
  const errors: string[] = []
  const costs: unknown[] = []
  const measure = async (view: string) => {
    const result = await page.evaluate(async () => {
      const frame = () =>
        new Promise<void>((r) => requestAnimationFrame(() => r()))
      for (let i = 0; i < 30; i++) await frame()
      const samples = []
      for (let i = 0; i < 120; i++) {
        await frame()
        samples.push(window.__GAME_DEBUG__!.performance())
      }
      const times = samples.map((s) => s.frameMs).sort((a, b) => a - b)
      return {
        samples,
        medianMs: times[60],
        p95Ms: times[114],
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
      }
    })
    costs.push({ view, ...result })
    console.log('REFERENCE_STYLE_COST', view, result.medianMs, result.p95Ms)
  }
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({ timeout: 90000 })
  await enter(page)
  const subtitle = page.getByRole('status', { name: 'Station assistant' })
  await expect(subtitle).toBeVisible()
  await expect(subtitle.getByText('IA', { exact: true })).toBeVisible()
  await page.screenshot({ path: out + '/subtitle.png' })
  await walkTo(page, 0, 15)
  await lookAt(page, { x: -0.5, y: 1.45, z: 18.23 })
  await page.screenshot({ path: out + '/arrival.png' })
  await measure('arrival')
  await page.keyboard.press('t')
  await expect(page.getByLabel('Held mission tablet')).toBeVisible()
  await page.waitForTimeout(700)
  await page.screenshot({ path: out + '/tablet.png' })
  await page.keyboard.press('t')
  await expect(page.getByLabel('Held mission tablet')).not.toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await approachCrew(page)
  await page.keyboard.press('e')
  const crew = page.getByRole('dialog', { name: 'Crew Access', exact: true })
  await expect
    .poll(
      async () => {
        const gesture = (await snapshot(page)).crewGesture
        return Boolean(
          gesture?.visible &&
          (gesture.reach ?? 0) > 0.7 &&
          Math.abs(gesture.projectedPosition.y) < 1,
        )
      },
      { intervals: [20, 30, 40] },
    )
    .toBe(true)
  console.log(
    'CARD_GESTURE_BEFORE',
    JSON.stringify((await snapshot(page)).crewGesture),
  )
  await page.screenshot({
    path: out + '/crew-card.png',
    animations: 'disabled',
  })
  console.log(
    'CARD_GESTURE_AFTER',
    JSON.stringify((await snapshot(page)).crewGesture),
  )
  await expect(crew).toBeVisible()
  await expect(
    crew.locator('.crew-identity').getByRole('status'),
  ).toContainText('ACCESS GRANTED')
  await page.screenshot({ path: out + '/crew-access.png' })
  await crew.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await enterObservationRoom(page)
  await walkTo(page, 3.2, -0.05)
  await approach(
    page,
    {
      x: PERSONAL_POSITION[0],
      y: PERSONAL_POSITION[1],
      z: PERSONAL_POSITION[2],
    },
    'E Personal Workstation',
  )
  await page.keyboard.press('e')
  const workstation = page.getByRole('dialog', {
    name: 'Personal Workstation',
    exact: true,
  })
  await expect(workstation).toBeVisible()
  await page.screenshot({ path: out + '/workstation.png' })
  await workstation
    .getByRole('button', { name: 'Project Gallery', exact: true })
    .click()
  await expect(
    workstation.getByRole('heading', { name: 'Project Gallery', exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: out + '/workstation-files.png' })
  await page.keyboard.press('Escape')
  await workstation.getByRole('button', { name: 'Leave terminal' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  await walkTo(page, 0, 0.05)
  await lookAt(page, { x: 0, y: 1.65, z: -2.65 })
  await page.screenshot({ path: out + '/tactical.png' })
  await measure('tactical')
  await walkTo(page, -2.4, -0.05)
  await approach(
    page,
    { x: RADIO_POSITION[0], y: RADIO_POSITION[1], z: RADIO_POSITION[2] },
    'E CDS Radio',
  )
  await page.keyboard.press('e')
  const radio = page.getByRole('dialog', { name: 'CDS Radio', exact: true })
  await expect(radio).toBeVisible()
  await radio.getByRole('button', { name: 'Play radio', exact: true }).click()
  await expect(
    radio.getByRole('button', { name: 'Pause radio', exact: true }),
  ).toBeVisible()
  const track = await radio.locator('.radio-now-playing strong').innerText()
  await radio.getByRole('button', { name: 'Next radio track' }).click()
  await expect(radio.locator('.radio-now-playing strong')).not.toHaveText(track)
  await radio.getByRole('slider', { name: 'Radio volume' }).fill('0.2')
  await expect(radio.getByRole('slider', { name: 'Radio volume' })).toHaveValue(
    '0.2',
  )
  await page.screenshot({ path: out + '/radio.png' })
  await radio.getByRole('button', { name: 'Pause radio', exact: true }).click()
  await radio.getByRole('button', { name: 'Leave radio' }).click()
  await expect.poll(async () => (await snapshot(page)).pointerLocked).toBe(true)
  expect(errors).toEqual([])
  await writeFile(out + '/timing.json', JSON.stringify(costs, null, 2))
})
