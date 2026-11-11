import { expect, it } from 'vitest'
import {
  TERMINAL_SCREENS,
  terminalHtmlScale,
  setStationFocus,
  interactionMode,
  stationView,
  wallMonitorDistance,
  WALL_SCREEN_POSES,
  SCREEN_POSITION,
  monitorDistance,
  CREW_ACCESS_POSITION,
  POWER_POSITION,
} from './station'

it('fits the physical monitor on narrow viewports without changing the desktop pose', () => {
  const aspect = 390 / 844
  const focus = { x: 0, y: 0, z: 0 }
  setStationFocus(focus, 'computer', aspect)
  const distance = Math.hypot(
    focus.x - SCREEN_POSITION[0],
    focus.z - SCREEN_POSITION[2],
  )
  const visibleWidth = 2 * distance * Math.tan((65 * Math.PI) / 360) * aspect
  expect(1.8 / visibleWidth).toBeCloseTo(0.85)
})

it('places Crew Access before the bridge door and frames it from inside the entry', () => {
  expect(CREW_ACCESS_POSITION[2] - 0.3).toBeCloseTo(12.07)
  expect(POWER_POSITION[2]).toBeGreaterThan(12)
  const crew = stationView('crew')
  expect(crew.position[0]).toBe(crew.lookAt[0])
  expect(crew.position[1]).toBe(crew.lookAt[1])
  expect(crew.position[2]).toBeGreaterThan(crew.lookAt[2])
  expect(crew.lookAt[0]).toBe(CREW_ACCESS_POSITION[0])
  expect(WALL_SCREEN_POSES.crew.rotation).toBe(0)
})

it('requires a computer target to open the screen', () => {
  expect(interactionMode('walking', null)).toBe('walking')
  expect(interactionMode('walking', 'computer')).toBe('computer')
  expect(interactionMode('walking', 'communications')).toBe('communications')
  expect(interactionMode('walking', 'personal')).toBe('personal')
  expect(interactionMode('walking', 'photo')).toBe('photo')
  expect(interactionMode('walking', 'crew')).toBe('crew')
  expect(interactionMode('walking', 'tactical')).toBe('tactical')
  expect(interactionMode('walking', 'coffee')).toBe('walking')
  expect(interactionMode('walking', 'bulkhead')).toBe('walking')
  expect(interactionMode('walking', 'dossier')).toBe('walking')
  expect(interactionMode('computer', null)).toBe('computer')
})

it('frames both wall terminals straight-on and leaves their casing inside narrow viewports', () => {
  const comms = stationView('communications')
  const personal = stationView('personal')
  expect(comms.position[1]).toBe(comms.lookAt[1])
  expect(comms.position[0]).toBeLessThan(comms.lookAt[0])
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

it('fits every terminal frame using actual FOV and viewport aspect without tilting the view', () => {
  const target = { x: 0, y: 0, z: 0 }
  for (const kind of [
    'computer',
    'communications',
    'personal',
    'crew',
    'tactical',
  ] as const) {
    const screen = TERMINAL_SCREENS[kind]
    for (const aspect of [390 / 844, 16 / 9, 32 / 9]) {
      for (const fov of [40, 65, 90]) {
        setStationFocus(target, kind, aspect, fov)
        const dx = target.x - screen.position[0]
        const dz = target.z - screen.position[2]
        const distance = Math.hypot(dx, dz)
        expect(target.y).toBe(screen.position[1])
        expect(dx / distance).toBeCloseTo(Math.sin(screen.rotation))
        expect(dz / distance).toBeCloseTo(Math.cos(screen.rotation))
        const height = 2 * distance * Math.tan((fov * Math.PI) / 360)
        expect(screen.frame[0] / (height * aspect)).toBeLessThanOrEqual(
          0.850001,
        )
        expect(screen.frame[1] / height).toBeLessThanOrEqual(0.820001)
      }
    }
  }
})

it('maps each unchanged CSS screen onto its physical surface without stretching', () => {
  for (const kind of [
    'computer',
    'communications',
    'personal',
    'crew',
    'tactical',
  ] as const) {
    const { display, pixels } = TERMINAL_SCREENS[kind]
    const scale = terminalHtmlScale(kind) / 400
    expect(pixels[0] * scale).toBeCloseTo(display[0])
    expect(pixels[1] * scale).toBeCloseTo(display[1])
  }
})

it('keeps focus finite during zero-size resize events and preserves photo focus', () => {
  const target = { x: 0, y: 0, z: 0 }
  setStationFocus(target, 'computer', 0)
  expect(Number.isFinite(target.z)).toBe(true)
  setStationFocus(target, 'photo', 1)
  expect([target.x, target.y, target.z]).toEqual(stationView('photo').position)
})
