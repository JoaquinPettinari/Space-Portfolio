import { expect, it } from 'vitest'
import {
  ENTRY_CREW_POSITION,
  ENTRY_CREW_SCREEN,
  ENTRY_PANELS,
  ENTRY_POWER_POSITION,
  ENTRY_DOCKING_DEPTH,
} from './entryLayout'
import { BULKHEAD_DEPTH, BULKHEAD_POCKET_PANELS } from './bulkhead'
import { ENTRY_OFFSET } from './bridgeLayout'
import { stationView } from '../interaction/station'

it('provides one receiving room, an open docking route and a continuous floor', () => {
  const floor = ENTRY_PANELS.find((p) => p.name === 'receiving-floor')!
  const arrival = ENTRY_PANELS.find((p) => p.name === 'docking-floor')!
  expect(floor.size[0]).toBe(5.6)
  expect(floor.at[1] + floor.size[1] / 2).toBe(0)
  expect(floor.at[2] - floor.size[2] / 2 + ENTRY_OFFSET).toBeCloseTo(11.2)
  expect(floor.at[2] + floor.size[2] / 2).toBeCloseTo(
    arrival.at[2] - arrival.size[2] / 2,
  )
  for (const side of [-1, 1]) {
    const jamb = ENTRY_PANELS.find((p) => p.name === `docking-jamb-${side}`)!
    expect(Math.abs(jamb.at[0]) - jamb.size[0] / 2).toBeCloseTo(1.2)
    expect(jamb.at[2] + ENTRY_OFFSET).toBe(16.2) // Historical procedural plan, no longer rendered.
    const shoulder = ENTRY_PANELS.find(
      (p) => p.name === `receiving-shoulder-${side}`,
    )!
    expect(shoulder.rotation?.[2]).toBe((-side * Math.PI) / 4)
  }
  expect(ENTRY_DOCKING_DEPTH).toBeCloseTo(18.265)
  const roof = ENTRY_PANELS.find((p) => p.name === 'receiving-roof')!
  expect(roof.at[1] - roof.size[1] / 2).toBe(3)
  expect(ENTRY_PANELS.some((p) => p.name.startsWith('technical-'))).toBe(false)
  const side = ENTRY_PANELS.find((p) => p.name === 'starboard-wall')!
  expect(side.at[0] - side.size[0] / 2).toBeCloseTo(2.7)
})

it('leaves the viewport unblocked while sealing its upper and lower edges', () => {
  const window = ENTRY_PANELS.find((p) => p.glass)!
  expect(window.size).toEqual([0.1, 1.1, 2])
  for (const name of ['port-lower', 'port-upper', 'port-forward', 'port-aft']) {
    const panel = ENTRY_PANELS.find((p) => p.name === name)!
    const yOverlap =
      (panel.size[1] + window.size[1]) / 2 -
      Math.abs(panel.at[1] - window.at[1])
    const zOverlap =
      (panel.size[2] + window.size[2]) / 2 -
      Math.abs(panel.at[2] - window.at[2])
    expect(Math.min(yOverlap, zOverlap)).toBeLessThan(1e-10)
  }
})

it('mounts the reader in front of the pocket, clear of moving leaves and the central opening', () => {
  const pocket = BULKHEAD_POCKET_PANELS[1]
  const face = pocket.at[2] + pocket.size[2] / 2 + ENTRY_OFFSET
  expect(ENTRY_CREW_POSITION[2] - 0.3).toBeCloseTo(face)
  expect(ENTRY_CREW_POSITION[0] - 0.65).toBeGreaterThan(1.34)
  expect(ENTRY_CREW_POSITION[0] + 0.65).toBeLessThan(2.7)
  expect(ENTRY_CREW_POSITION[2] - 0.3).toBeGreaterThan(BULKHEAD_DEPTH + 0.24)
  expect(ENTRY_CREW_SCREEN[2] - ENTRY_CREW_POSITION[2]).toBeCloseTo(0.145)
  const focus = stationView('crew').position
  expect(focus[0]).toBe(2)
  expect(focus[2]).toBeGreaterThan(ENTRY_CREW_SCREEN[2])
  expect(focus[2]).toBeLessThan(14.1)
  expect(ENTRY_POWER_POSITION).toEqual([-2.7, 1.65, 13.4])
})
