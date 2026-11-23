// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  getDockingSampleCursor,
  parseDockingMotion,
  type DockingMotion,
} from './dockingMotion'

function fixture(): DockingMotion {
  return {
    duration: 8,
    fps: 30,
    samples: [0, 3, 8].map((time) => ({
      time,
      pampaPosition: [0, 1, 30 + (8 - time)],
      pampaYaw: 0,
      cameraPosition: [12, 7.4, 38],
      cameraTarget: [0, 1.45, 29.3],
      clampClosure: time === 8 ? 1 : 0,
    })),
  }
}

describe('authored docking motion', () => {
  it('parses the real Blender export with all 241 samples and final contact pose', () => {
    const text = readFileSync(
      new URL(
        '../../../docs/assets/docking-intro/docking-motion.json',
        import.meta.url,
      ),
      'utf8',
    )
    const motion = parseDockingMotion(text)
    expect(motion.duration).toBe(8)
    expect(motion.fps).toBe(30)
    expect(motion.samples).toHaveLength(241)
    expect(motion.samples[0].time).toBe(0)
    expect(motion.samples[240].time).toBe(8)
    expect(motion.samples[240].clampClosure).toBe(1)
    expect(motion.samples[240].pampaPosition[2]).toBeCloseTo(31.1)
  })

  it('rejects malformed JSON, missing samples and incomplete position vectors', () => {
    expect(() => parseDockingMotion('{')).toThrow()
    expect(() => parseDockingMotion('null')).toThrow('root')
    expect(() => parseDockingMotion('[]')).toThrow('root')
    expect(() => parseDockingMotion('{"duration":8,"fps":30}')).toThrow(
      'samples',
    )
    const motion = fixture()
    const malformed = {
      ...motion,
      samples: [
        { ...motion.samples[0], cameraPosition: [1, 2] },
        ...motion.samples.slice(1),
      ],
    }
    expect(() => parseDockingMotion(JSON.stringify(malformed))).toThrow(
      'cameraPosition',
    )
  })

  it.each(['duration', 'fps'])('requires finite positive %s', (field) => {
    for (const value of [0, -1, null, '30']) {
      expect(() =>
        parseDockingMotion(JSON.stringify({ ...fixture(), [field]: value })),
      ).toThrow('Invalid docking motion')
    }
    const text = JSON.stringify({ ...fixture(), [field]: 999 })
    expect(() => parseDockingMotion(text.replace('999', '1e999'))).toThrow(
      field,
    )
  })

  it('rejects unordered, duplicate, shifted and truncated sample times', () => {
    for (const times of [
      [0, 3, 3],
      [0, 4, 3],
      [1, 3, 8],
      [0, 3, 7],
    ]) {
      const motion = fixture()
      expect(() =>
        parseDockingMotion(
          JSON.stringify({
            ...motion,
            samples: motion.samples.map((sample, index) => ({
              ...sample,
              time: times[index],
            })),
          }),
        ),
      ).toThrow('Invalid docking motion')
    }
  })

  it('rejects nonfinite transform data and invalid clamp travel', () => {
    const motion = fixture()
    for (const change of [
      { pampaYaw: null },
      { pampaPosition: [0, '1', 2] },
      { cameraTarget: [0, 1, null] },
      { clampClosure: -0.1 },
      { clampClosure: 1.1 },
    ]) {
      expect(() =>
        parseDockingMotion(
          JSON.stringify({
            ...motion,
            samples: [
              { ...motion.samples[0], ...change },
              ...motion.samples.slice(1),
            ],
          }),
        ),
      ).toThrow('Invalid docking motion')
    }
  })

  it('interpolates nonuniform sample times without assuming the nominal FPS', () => {
    const motion = fixture()
    expect(getDockingSampleCursor(motion, 0)).toBe(0)
    expect(getDockingSampleCursor(motion, 1.5)).toBe(0.5)
    expect(getDockingSampleCursor(motion, 3)).toBe(1)
    expect(getDockingSampleCursor(motion, 5.5)).toBe(1.5)
    expect(getDockingSampleCursor(motion, 8)).toBe(2)
  })

  it('clamps both ends and keeps NaN from reaching the camera', () => {
    const motion = fixture()
    expect(getDockingSampleCursor(motion, -10)).toBe(0)
    expect(getDockingSampleCursor(motion, 100)).toBe(2)
    expect(getDockingSampleCursor(motion, NaN)).toBe(0)
    expect(getDockingSampleCursor(motion, -Infinity)).toBe(0)
    expect(getDockingSampleCursor(motion, Infinity)).toBe(2)
  })
})
