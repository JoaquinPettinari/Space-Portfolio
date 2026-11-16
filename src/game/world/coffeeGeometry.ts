import {
  CylinderGeometry,
  LatheGeometry,
  Matrix4,
  Quaternion,
  Euler,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const COFFEE_FINISHES = ['body', 'steel', 'rubber', 'trim'] as const
export type CoffeeFinish = (typeof COFFEE_FINISHES)[number]

/** Manufactured parts share four draw calls; no per-frame mesh construction. */
export function createCoffeeGeometry() {
  const parts: Record<CoffeeFinish, BufferGeometry[]> = {
    body: [],
    steel: [],
    rubber: [],
    trim: [],
  }
  const add = (
    finish: CoffeeFinish,
    geometry: BufferGeometry,
    at: readonly number[],
    rotation: readonly number[] = [0, 0, 0],
  ) => {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    flat.applyMatrix4(
      new Matrix4().compose(
        new Vector3().fromArray(at),
        new Quaternion().setFromEuler(
          new Euler(rotation[0], rotation[1], rotation[2]),
        ),
        new Vector3(1, 1, 1),
      ),
    )
    parts[finish].push(flat)
  }
  const box = (
    finish: CoffeeFinish,
    at: readonly number[],
    size: readonly [number, number, number],
    radius = 0.008,
  ) => add(finish, new RoundedBoxGeometry(...size, 1, radius), at)
  box('body', [0, 0.45, 0], [0.78, 0.9, 0.68])
  box('steel', [0, 0.9125, 0], [0.78, 0.025, 0.68])
  box('rubber', [0, 0.46, 0.342], [0.65, 0.73, 0.006], 0.001)
  box('trim', [0, 0.8, 0.348], [0.2, 0.008, 0.006], 0.001)
  box('steel', [0.24, 0.5, 0.35], [0.018, 0.19, 0.014], 0.003)
  for (let i = 0; i < 7; i++)
    box('rubber', [-0.19 + i * 0.06, 0.14, 0.35], [0.035, 0.012, 0.012], 0.002)
  // Open front recess, not a solid box through the cup.
  box('body', [0, 1.205, -0.17], [0.62, 0.53, 0.17])
  box('body', [0, 1.4, -0.03], [0.62, 0.14, 0.4])
  for (const side of [-1, 1])
    box('steel', [side * 0.27, 1.15, -0.025], [0.07, 0.36, 0.35])
  box('rubber', [0, 1.15, -0.075], [0.46, 0.34, 0.024])
  box('rubber', [0, 1.28, 0.05], [0.08, 0.15, 0.22])
  add('steel', new CylinderGeometry(0.072, 0.066, 0.09, 24), [0, 1.23, 0.17])
  add('steel', new CylinderGeometry(0.019, 0.014, 0.08, 16), [0, 1.145, 0.17])
  box('rubber', [0.12, 1.205, 0.24], [0.19, 0.035, 0.045], 0.012)
  box('steel', [0, 0.935, 0.16], [0.48, 0.025, 0.28])
  for (let i = 0; i < 12; i++)
    box('rubber', [-0.205 + i * 0.037, 0.95, 0.16], [0.018, 0.004, 0.21], 0.001)
  add(
    'steel',
    new CylinderGeometry(0.075, 0.075, 0.3, 24),
    [-0.18, 1.16, -0.13],
  )
  box('trim', [-0.18, 1.16, -0.052], [0.015, 0.2, 0.006], 0.002)
  add(
    'rubber',
    new CylinderGeometry(0.084, 0.084, 0.025, 24),
    [-0.18, 1.3225, -0.13],
  )
  add(
    'steel',
    new CylinderGeometry(0.021, 0.021, 0.012, 16),
    [0.2, 1.37, 0.178],
    [Math.PI / 2, 0, 0],
  )
  box('trim', [0, 1.48, -0.03], [0.56, 0.009, 0.32], 0.003)
  const geometries = {} as Record<CoffeeFinish, BufferGeometry>
  for (const finish of COFFEE_FINISHES) {
    const geometry = mergeGeometries(parts[finish])
    parts[finish].forEach((p) => p.dispose())
    if (!geometry) throw new Error('Incompatible coffee parts')
    geometry.computeBoundingBox()
    geometries[finish] = geometry
  }
  const cupBody = new LatheGeometry(
    [
      [0, -0.07],
      [0.07, -0.07],
      [0.085, 0.07],
      [0.073, 0.07],
      [0.061, -0.055],
      [0, -0.055],
    ].map(([x, y]) => new Vector2(x, y)),
    24,
  ).toNonIndexed()
  const handle = new TorusGeometry(0.045, 0.009, 6, 16).toNonIndexed()
  handle.translate(0.1, 0, 0)
  const cup = mergeGeometries([cupBody, handle])!
  cupBody.dispose()
  handle.dispose()
  return {
    geometries,
    cup,
    dispose: () => {
      Object.values(geometries).forEach((g) => g.dispose())
      cup.dispose()
    },
  }
}
