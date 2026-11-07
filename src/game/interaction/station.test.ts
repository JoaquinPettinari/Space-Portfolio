import { expect, it } from 'vitest'
import {
  archiveFocusZ,
  FOCUS_POSITION,
  interactionMode,
  stationView,
  wallMonitorDistance,
  WALL_SCREEN_POSES,
  SCREEN_POSITION,
  monitorDistance,
} from './station'

it('fits the physical monitor on narrow viewports without changing the desktop pose', () => {
  expect(archiveFocusZ(16 / 9)).toBe(FOCUS_POSITION[2])
  const aspect = 390 / 844
  const distance = archiveFocusZ(aspect) - SCREEN_POSITION[2]
  const visibleWidth = 2 * distance * Math.tan((65 * Math.PI) / 360) * aspect
  expect(1.8 / visibleWidth).toBeCloseTo(0.85)
})

it('requires a computer target to open the screen', () => {
  expect(interactionMode('walking', null)).toBe('walking')
  expect(interactionMode('walking', 'computer')).toBe('computer')
  expect(interactionMode('walking', 'hologram')).toBe('hologram')
  expect(interactionMode('walking', 'communications')).toBe('communications')
  expect(interactionMode('walking', 'personal')).toBe('personal')
  expect(interactionMode('walking', 'photo')).toBe('photo')
  expect(interactionMode('walking', 'crew')).toBe('crew')
  expect(interactionMode('walking', 'coffee')).toBe('walking')
  expect(interactionMode('walking', 'bulkhead')).toBe('walking')
  expect(interactionMode('walking', 'dossier')).toBe('walking')
  expect(interactionMode('computer', null)).toBe('computer')
})

it('frames both wall terminals straight-on and leaves their casing inside narrow viewports', () => {
  const comms = stationView('communications')
  const personal = stationView('personal')
  expect(comms.position[1]).toBe(comms.lookAt[1])
  expect(comms.position[0]).toBe(comms.lookAt[0])
  expect(personal.position[2]).toBe(personal.lookAt[2])
  expect(personal.position[1]).toBe(personal.lookAt[1])
  expect(comms.position[2]).toBeGreaterThan(
    WALL_SCREEN_POSES.communications.position[2],
  )
  expect(personal.position[0]).toBeLessThan(
    WALL_SCREEN_POSES.personal.position[0],
  )
  expect(wallMonitorDistance(16 / 9)).toBeCloseTo(1.053, 3)
  const aspect = 390 / 844
  const visibleWidth =
    2 * wallMonitorDistance(aspect) * Math.tan((65 * Math.PI) / 360) * aspect
  expect(1.3 / visibleWidth).toBeCloseTo(0.85)
})

it('keeps both forward bezels within vertical and horizontal viewport margins', () => {
  for (const aspect of [390 / 844, 1, 16 / 9, 21 / 9]) {
    const height = 2 * monitorDistance(aspect) * Math.tan((65 * Math.PI) / 360)
    expect(1.1 / height).toBeLessThanOrEqual(0.820001)
    expect(1.8 / (height * aspect)).toBeLessThanOrEqual(0.850001)
  }
  expect(stationView('computer').lookAt[0]).toBeLessThan(0)
  expect(stationView('communications').lookAt[0]).toBeGreaterThan(0)
})
