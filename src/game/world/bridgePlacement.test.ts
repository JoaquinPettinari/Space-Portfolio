import { expect, it } from 'vitest'
import {
  BRIDGE_OFFSET_Z,
  TRANSITION_START,
  TRANSITION_END,
  bridgePoint,
} from './bridgePlacement'
import {
  TERMINAL_SCREENS,
  TABLE_POSITION,
  COFFEE_POSITION,
  PHOTO_POSITION,
} from '../interaction/station'
import { COMMAND_POSES } from './commandLayout'

it('reserves three metres before the bridge, including clearance from its rear facade', () => {
  expect(TRANSITION_END - TRANSITION_START).toBeCloseTo(3)
  expect(5.1 + BRIDGE_OFFSET_Z + 0.15).toBeCloseTo(TRANSITION_START)
  for (const kind of [
    'computer',
    'communications',
    'personal',
    'tactical',
  ] as const)
    expect(TERMINAL_SCREENS[kind].position[2]).toBeLessThan(
      TRANSITION_START - 0.5,
    )
  expect(TABLE_POSITION[2] + 1.35).toBeLessThan(TRANSITION_START)
  for (const p of [COFFEE_POSITION, PHOTO_POSITION])
    expect(p[2] + 0.5).toBeLessThan(TRANSITION_START)
  expect(TERMINAL_SCREENS.crew.position[2]).toBeGreaterThan(TRANSITION_END)
})

it('moves monitor targets by the same translation as local console geometry', () => {
  for (const kind of ['computer', 'communications'] as const)
    expect(TERMINAL_SCREENS[kind].position).toEqual(
      bridgePoint(COMMAND_POSES[kind].position),
    )
})
