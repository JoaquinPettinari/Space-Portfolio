import type { StaticPanel } from './StaticPanels'
import { TRANSITION_CENTER } from './bridgePlacement'

/** Props recessed behind the existing corridor collider plane at |X| = 1.5 m. */
export const PASSAGE_RECESS_PANELS: StaticPanel[] = []
for (const side of [-1, 1]) {
  const add = (
    x: number,
    y: number,
    z: number,
    size: StaticPanel['size'],
    color = '#293640',
    glow = false,
  ) =>
    PASSAGE_RECESS_PANELS.push({
      at: [side * x, y, TRANSITION_CENTER + z],
      size,
      color,
      glow,
    })
  add(1.9, 1.69, 0, [0.03, 1.52, 2.4])
  for (const y of [1.03, 1.78]) {
    add(1.73, y, 0, [0.3, 0.045, 2.25], '#718087')
    add(1.57, y + 0.06, 0, [0.018, 0.025, 2.25], '#ac8c57')
    add(1.7, y - 0.04, 0, [0.1, 0.015, 1.95], '#edbd7c', true)
  }
  for (let i = 0; i < 7; i++) {
    const z = -0.9 + i * 0.105
    add(1.72, 1.28, z, [0.22, 0.45, 0.075], i % 2 ? '#58634f' : '#263f51')
    add(1.603, 1.34, z, [0.009, 0.013, 0.05], '#ac8c57')
  }
  for (const z of [-0.64, 0.54]) {
    add(1.72, 2, z, [0.23, 0.39, 0.62], '#263f51')
    add(1.595, 2, z, [0.017, 0.055, 0.23], '#293640')
    for (const dz of [-0.21, 0.21])
      add(1.59, 2.1, z + dz, [0.02, 0.14, 0.04], '#ac8c57')
  }
  add(1.73, 2.38, 0, [0.08, 0.025, 2.1], '#edbd7c', true)
}
