import { expect, it } from 'vitest'
import { completeMission } from './missions'
it('allows independent objectives and ignores repeated completion', () => {
  const completed = completeMission([], 'uplink')
  expect(completed).toEqual(['uplink'])
  expect(completeMission(completed, 'uplink')).toBe(completed)
  expect(completeMission(completed, 'crew')).toEqual(['uplink', 'crew'])
})
