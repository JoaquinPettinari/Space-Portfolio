import { expect, it } from 'vitest'
import { completeMission, completedObjectiveCount, missions } from './missions'
it('keeps the tactical inspection separate from the professional archive', () => {
  const completed = completeMission(['crew'], 'tactical')
  expect(completed).toEqual(['crew', 'tactical'])
  expect(completeMission(completed, 'tactical')).toBe(completed)
})
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

it('counts only playable objectives, retaining automatic activity flags independently', () => {
  expect(missions.map(({ id }) => id)).toEqual([
    'crew',
    'tactical',
    'archives',
    'uplink',
    'dossier',
  ])
  expect(completedObjectiveCount(['lighting', 'tablet'])).toBe(0)
  expect(
    completedObjectiveCount([
      'lighting',
      'tablet',
      'crew',
      'tactical',
      'archives',
      'uplink',
      'dossier',
    ]),
  ).toBe(5)
})
