// @vitest-environment node
import { expect, it } from 'vitest'
import { RADIO_BUTTONS } from '../radioControls'
import { INTERACTION_DISTANCE } from '../interaction/station'
import {
  GALLEY_COLLIDERS,
  GALLEY_RADIO,
  radioButtonWorldPosition,
} from './galleyLayout'

it('places local radio controls in the Blender world frame, facing the aisle', () => {
  const local = [0.1, 0.2, 0.3] as const
  const world = radioButtonWorldPosition(local)
  // Approved right-hand galley anchor; no bridge-local Z offset belongs here.
  expect(world[0]).toBeCloseTo(3.38)
  expect(world[1]).toBeCloseTo(1.38)
  expect(world[2]).toBeCloseTo(1.07)
  expect(world[2]).toBeLessThan(GALLEY_RADIO.position[2])
  expect(local).toEqual([0.1, 0.2, 0.3])
})

it('keeps all radio keys above the cabinet collision and within reach from the aisle', () => {
  const standing = [3.0, 1.65, 0.35] as const
  const highestCabinet = Math.max(
    ...GALLEY_COLLIDERS.map(({ position, half }) => position[1] + half[1]),
  )
  for (const { position } of RADIO_BUTTONS) {
    const point = radioButtonWorldPosition([
      position[0],
      position[1],
      position[2] + 0.024,
    ])
    expect(point[1]).toBeGreaterThan(highestCabinet)
    expect(
      Math.hypot(
        ...point.map((coordinate, axis) => coordinate - standing[axis]),
      ),
    ).toBeLessThan(INTERACTION_DISTANCE)
  }
  // The test approach stands outside both cabinet footprints. Browser tests
  // still verify actual walking, ray targets and the animated button contact.
  for (const { position, half } of GALLEY_COLLIDERS) {
    expect(
      Math.abs(standing[0] - position[0]) > half[0] ||
        Math.abs(standing[2] - position[2]) > half[2],
    ).toBe(true)
  }
})
