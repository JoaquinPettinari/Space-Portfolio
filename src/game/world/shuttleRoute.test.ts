import { expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { sampleShuttleRoute } from './shuttleRoute'

it('keeps the nose aligned with forward travel around the entire closed route', () => {
  const position = new Vector3(),
    next = new Vector3(),
    tangent = new Vector3()
  for (let phase = 0; phase <= Math.PI * 2; phase += 0.1) {
    sampleShuttleRoute(phase, position, tangent)
    const nose = new Vector3(1, 0, 0).applyQuaternion(
      new Quaternion().setFromUnitVectors(
        new Vector3(1, 0, 0),
        tangent.clone().normalize(),
      ),
    )
    sampleShuttleRoute(phase + 0.001, next, tangent)
    expect(nose.dot(next.sub(position).normalize())).toBeGreaterThan(0.999)
    expect(position.length()).toBeGreaterThan(20)
    expect(position.length()).toBeLessThan(65)
  }
  sampleShuttleRoute(0, position, tangent)
  sampleShuttleRoute(Math.PI * 2, next, tangent)
  expect(position.distanceTo(next)).toBeLessThan(0.000001)
})
