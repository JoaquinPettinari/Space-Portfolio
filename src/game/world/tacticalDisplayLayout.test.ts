// @vitest-environment node
import { Euler, Vector3 } from 'three'
import { expect, it } from 'vitest'
import { monitorDistance, TERMINAL_SCREENS } from '../interaction/station'
import {
  tacticalDisplayLayout,
  TACTICAL_MODEL_BAY,
  TACTICAL_MODEL_TILT,
} from './tacticalDisplayLayout'

it('centers the model pivot in the open UI bay and keeps every yaw/zoom inside its chrome', () => {
  const size = [0.43, 0.382, 1.6] as const
  for (const aspect of [16 / 9, 4 / 3, 9 / 16]) {
    const { position, scale } = tacticalDisplayLayout(size, aspect, 65)
    const planeDistance = monitorDistance(
      aspect,
      ...TERMINAL_SCREENS.tactical.frame,
      65,
    )
    const pixel = (point: Vector3) => {
      // Intersect the camera ray with the physical HTML plane (local Z=0).
      const factor = planeDistance / (planeDistance - point.z)
      return {
        x: 480 + (point.x * factor) / 0.0025,
        y: 270 - (point.y * factor) / 0.0025,
      }
    }
    const center = pixel(new Vector3(...position))
    expect(center.x).toBeCloseTo(
      (TACTICAL_MODEL_BAY.left + TACTICAL_MODEL_BAY.right) / 2,
    )
    expect(center.y).toBeCloseTo(
      (TACTICAL_MODEL_BAY.top + TACTICAL_MODEL_BAY.bottom) / 2,
    )
    expect(scale).toBeGreaterThan(0.4)
    for (const zoom of [0.65, 1])
      for (let turn = 0; turn < 64; turn++) {
        for (const x of [-1, 1])
          for (const y of [-1, 1])
            for (const z of [-1, 1]) {
              const point = new Vector3(
                (size[0] * x) / 2,
                (size[1] * y) / 2,
                (size[2] * z) / 2,
              )
                .applyEuler(new Euler(0, (turn * Math.PI) / 32, 0))
                .applyEuler(new Euler(TACTICAL_MODEL_TILT, 0, 0))
                .multiplyScalar(scale * zoom)
                .add(new Vector3(...position))
              const projected = pixel(point)
              expect(projected.x).toBeGreaterThan(TACTICAL_MODEL_BAY.left + 15)
              expect(projected.x).toBeLessThan(TACTICAL_MODEL_BAY.right - 15)
              expect(projected.y).toBeGreaterThan(TACTICAL_MODEL_BAY.top + 33)
              expect(projected.y).toBeLessThan(TACTICAL_MODEL_BAY.bottom - 33)
            }
      }
  }
})
