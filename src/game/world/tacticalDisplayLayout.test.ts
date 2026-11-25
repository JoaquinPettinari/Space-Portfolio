// @vitest-environment node
import { Euler, Vector3 } from 'three'
import { expect, it } from 'vitest'
import { monitorDistance, TERMINAL_SCREENS } from '../interaction/station'
import {
  TACTICAL_MODEL_ANCHOR,
  TACTICAL_MODEL_BAY,
  TACTICAL_MODEL_SCALE,
  TACTICAL_MODEL_TILT,
} from './tacticalDisplayLayout'

it('aligns the UI to a fixed projector and contains every yaw without moving that projector', () => {
  const size = [0.43, 0.382, 1.6] as const
  const screen = TERMINAL_SCREENS.tactical
  for (const aspect of [16 / 9, 4 / 3, 9 / 16]) {
    const distance = monitorDistance(aspect, ...screen.frame, 65)
    const pixel = (point: Vector3) => {
      point
        .sub(new Vector3(...screen.position))
        .applyEuler(new Euler(0, -screen.rotation, 0))
      const factor = distance / (distance - point.z)
      return {
        x: 480 + (point.x * factor) / (screen.display[0] / 960),
        y: 270 - (point.y * factor) / (screen.display[1] / 540),
      }
    }
    const center = pixel(new Vector3(...TACTICAL_MODEL_ANCHOR))
    expect(center.x).toBeCloseTo(
      (TACTICAL_MODEL_BAY.left + TACTICAL_MODEL_BAY.right) / 2,
    )
    expect(center.y).toBeCloseTo(
      (TACTICAL_MODEL_BAY.top + TACTICAL_MODEL_BAY.bottom) / 2,
    )
    for (let turn = 0; turn < 64; turn++)
      for (const x of [-1, 1])
        for (const y of [-1, 1])
          for (const z of [-1, 1]) {
            const p = new Vector3(
              (size[0] * x) / 2,
              (size[1] * y) / 2,
              (size[2] * z) / 2,
            )
              .applyEuler(new Euler(0, (turn * Math.PI) / 32, 0))
              .multiplyScalar(TACTICAL_MODEL_SCALE)
              .applyEuler(new Euler(TACTICAL_MODEL_TILT, 0, 0))
              .add(new Vector3(...TACTICAL_MODEL_ANCHOR))
            const projected = pixel(p)
            expect(projected.x).toBeGreaterThan(TACTICAL_MODEL_BAY.left + 15)
            expect(projected.x).toBeLessThan(TACTICAL_MODEL_BAY.right - 15)
            expect(projected.y).toBeGreaterThan(TACTICAL_MODEL_BAY.top + 33)
            expect(projected.y).toBeLessThan(TACTICAL_MODEL_BAY.bottom - 33)
          }
  }
})
