// @vitest-environment node
import { expect, it } from 'vitest'
import { opaqueDepthOrder } from './opaqueDepthOrder'

it('draws near opaque surfaces first while retaining explicit priorities and stable ties', () => {
  const near = { id: 2, z: 0.1, groupOrder: 0, renderOrder: 0 }
  const far = { id: 1, z: 0.9, groupOrder: 0, renderOrder: 0 }
  expect([far, near].sort(opaqueDepthOrder)).toEqual([near, far])
  expect(opaqueDepthOrder({ ...near, renderOrder: 1 }, far)).toBeGreaterThan(0)
  expect(opaqueDepthOrder({ ...near, groupOrder: 1 }, far)).toBeGreaterThan(0)
  expect(opaqueDepthOrder({ ...near, z: far.z }, far)).toBeGreaterThan(0)
})
