// @vitest-environment node
import { BoxGeometry, Matrix4 } from 'three'
import { expect, it } from 'vitest'
import { ARRIVAL_DEPTH, ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'
import cabinLayout from './arrivalCabinLayout.json' with { type: 'json' }
import { EVA_ALCOVE } from './evaEquipmentLayout'
import {
  arrivalFloorOcclusion,
  createArrivalFloorGeometry,
  packArrivalFloorOcclusion,
} from './arrivalFloorMapping'

it('adds a bounded soft contact band around shared furniture and leaves the walk route clear', () => {
  const { bench } = cabinLayout
  const x = bench.x
  const z = (bench.startZ + bench.endZ) / 2 - ARRIVAL_ORIGIN_Z
  const edge = x + bench.depth / 2
  expect(arrivalFloorOcclusion(x, z)).toBeCloseTo(0.2)
  expect(arrivalFloorOcclusion(edge + 0.12, z)).toBeCloseTo(0.6)
  expect(arrivalFloorOcclusion(edge + 0.24, z)).toBeCloseTo(1)
  expect(arrivalFloorOcclusion(0, z)).toBe(1)
})

it('packs red AO without changing green roughness, blue or opacity', () => {
  const data = new Uint8ClampedArray(16 * 16 * 4)
  for (let i = 0; i < data.length; i += 4) data.set([200, 170, 120, 255], i)
  packArrivalFloorOcclusion(data, 16)
  expect(Array.from(data).some((value, i) => i % 4 === 0 && value < 255)).toBe(
    true,
  )
  for (let i = 0; i < data.length; i += 4)
    expect(Array.from(data.slice(i + 1, i + 4))).toEqual([170, 120, 255])
})

it('grounds the suit cabinet using the real alcove footprint', () => {
  const front = ARRIVAL_DEPTH - 0.04 + EVA_ALCOVE.frontZ
  expect(arrivalFloorOcclusion(EVA_ALCOVE.centerX, front)).toBeCloseTo(0.2)
  expect(arrivalFloorOcclusion(EVA_ALCOVE.centerX, front - 0.12)).toBeCloseTo(
    0.6,
  )
  expect(arrivalFloorOcclusion(EVA_ALCOVE.centerX, front - 0.3)).toBe(1)
})

it('creates planar secondary coordinates while retaining the source mesh and original normal UVs', () => {
  const source = new BoxGeometry()
  const original = Array.from(source.getAttribute('uv').array)
  const copy = createArrivalFloorGeometry(
    source,
    new Matrix4().makeTranslation(2, 0, 3),
  )
  expect(copy).not.toBe(source)
  expect(source.getAttribute('uv1')).toBeUndefined()
  expect(Array.from(source.getAttribute('uv').array)).toEqual(original)
  expect(Array.from(copy.getAttribute('uv').array)).toEqual(original)
  expect(copy.getAttribute('uv1').count).toBe(
    source.getAttribute('position').count,
  )
  expect(
    Array.from(copy.getAttribute('uv1').array).every(Number.isFinite),
  ).toBe(true)
  copy.dispose()
  source.dispose()
})
