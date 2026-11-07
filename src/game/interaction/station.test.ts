import { expect, it } from 'vitest'
import { archiveFocusZ, FOCUS_POSITION, interactionMode } from './station'

it('fits the physical monitor on narrow viewports without changing the desktop pose', () => {
  expect(archiveFocusZ(16 / 9)).toBe(FOCUS_POSITION[2])
  const aspect = 390 / 844
  const distance = archiveFocusZ(aspect) + 3.535
  const visibleWidth = 2 * distance * Math.tan((65 * Math.PI) / 360) * aspect
  expect(1.65 / visibleWidth).toBeCloseTo(0.85)
})

it('requires a computer target to open the screen', () => {
  expect(interactionMode('walking', null)).toBe('walking')
  expect(interactionMode('walking', 'computer')).toBe('computer')
  expect(interactionMode('walking', 'hologram')).toBe('hologram')
  expect(interactionMode('walking', 'communications')).toBe('communications')
  expect(interactionMode('walking', 'personal')).toBe('personal')
  expect(interactionMode('walking', 'photo')).toBe('photo')
  expect(interactionMode('walking', 'coffee')).toBe('walking')
  expect(interactionMode('walking', 'bulkhead')).toBe('walking')
  expect(interactionMode('walking', 'dossier')).toBe('walking')
  expect(interactionMode('computer', null)).toBe('computer')
})
