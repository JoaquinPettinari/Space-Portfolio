import { expect, it } from 'vitest'
import { interactionMode } from './station'

it('requires a computer target to open the screen', () => {
  expect(interactionMode('walking', null)).toBe('walking')
  expect(interactionMode('walking', 'computer')).toBe('computer')
  expect(interactionMode('walking', 'hologram')).toBe('hologram')
  expect(interactionMode('walking', 'dossier')).toBe('walking')
  expect(interactionMode('computer', null)).toBe('computer')
})
