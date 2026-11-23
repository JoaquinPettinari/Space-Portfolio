import { expect, it } from 'vitest'
import { crossedPassageMidpoint } from './passageDialogue'
import { PASSAGE_CENTER } from './world/passageLayout'
it('only triggers a forward crossing within the actual passage bounds', () => {
  const before = { x: 0, y: 1.7, z: PASSAGE_CENTER + 0.1 }
  const after = { x: 0, y: 1.7, z: PASSAGE_CENTER - 0.1 }
  expect(crossedPassageMidpoint(before, after)).toBe(true)
  // The midpoint is wider than the entry collar: walking along either wall
  // must still activate the introduction.
  for (const x of [-1.5, 1.5]) {
    expect(crossedPassageMidpoint({ ...before, x }, { ...after, x })).toBe(true)
  }
  expect(
    crossedPassageMidpoint({ ...before, x: 2.1 }, { ...after, x: 2.1 }),
  ).toBe(false)
  expect(crossedPassageMidpoint(after, before)).toBe(false)
  expect(crossedPassageMidpoint(after, after)).toBe(false)
  expect(crossedPassageMidpoint({ ...before, x: 4 }, after)).toBe(false)
  expect(crossedPassageMidpoint(before, { ...after, y: 5 })).toBe(false)
  expect(crossedPassageMidpoint({ ...before, z: 18 }, after)).toBe(false)
})
