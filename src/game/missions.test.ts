import { expect, it } from 'vitest'
import { completeMission } from './missions'
it('records independent activities and ignores repeated completion', () => {
  const completed = completeMission([], 'dossier')
  expect(completed).toEqual(['dossier'])
  expect(completeMission(completed, 'dossier')).toBe(completed)
  expect(completeMission(completed, 'crew')).toEqual(['dossier', 'crew'])
})
it('accepts either a service record or a project as the archive objective', () => {
  const completed = completeMission([], 'diagnostics')
  expect(completed).toEqual(['archives'])
  expect(completeMission(completed, 'archives')).toBe(completed)
})
it('does not mark a mailto click as a successful transmission', () => {
  const completed = completeMission([], 'crew')
  expect(completeMission(completed, 'uplink')).toBe(completed)
})
