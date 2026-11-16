import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { enter, enterObservationRoom, lookAt } from './helpers/game'

test('profiles interior CPU cost with native gameplay', async ({
  page,
}, info) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Game controls')).toBeVisible({
    timeout: 60_000,
  })
  await enter(page)
  const client = await page.context().newCDPSession(page)
  await client.send('Profiler.enable')
  for (const location of ['arrival', 'bridge'] as const) {
    if (location === 'bridge') await enterObservationRoom(page)
    await lookAt(page, { x: 1, y: 1.9, z: location === 'arrival' ? 12 : -12 })
    const inventory = await page.evaluate(() =>
      window.__GAME_DEBUG__!.renderInventory(),
    )
    await writeFile(
      info.outputPath(`${location}-draws.json`),
      JSON.stringify(inventory, null, 2),
    )
    console.log(
      'DRAW_INVENTORY',
      location,
      JSON.stringify(inventory.filter((entry) => entry.draws > 1)),
    )
    await client.send('Profiler.start')
    await page.waitForTimeout(4000)
    const { profile } = await client.send('Profiler.stop')
    await writeFile(
      info.outputPath(`${location}.cpuprofile`),
      JSON.stringify(profile),
    )
    const totals = new Map<number, number>()
    for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
      const id = profile.samples![i]
      totals.set(id, (totals.get(id) ?? 0) + (profile.timeDeltas?.[i] ?? 0))
    }
    const top = profile.nodes
      .map((node) => ({
        name: node.callFrame.functionName,
        url: node.callFrame.url,
        ms: (totals.get(node.id) ?? 0) / 1000,
      }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 25)
    console.log('CPU_PROFILE', location, JSON.stringify(top))
  }
  await client.detach()
})
