import type { StaticPanel } from './StaticPanels'
import { bridgePoint } from './bridgePlacement'

/** Fixed visual props inside the existing wall recesses, outside the central route. */
export const INTERIOR_SHELF_PANELS: StaticPanel[] = []
const add = (
  at: StaticPanel['at'],
  size: StaticPanel['size'],
  color = '#293640',
  glow = false,
) => INTERIOR_SHELF_PANELS.push({ at, size, color, glow })

// World-space anchor, translated with the compact bridge rather than the corridor.
const wallZ = bridgePoint([0, 0, 3.7])[2]
// The former loose books now rest on this shelf, beside the personal workstation.
add([4.42, 1.35, wallZ], [0.045, 0.78, 0.92])
add([4.16, 1.015, wallZ], [0.58, 0.05, 0.92], '#718087')
for (const z of [wallZ - 0.31, wallZ + 0.31]) {
  add([4.37, 0.89, z], [0.15, 0.21, 0.035])
  add([4.17, 1.065, z], [0.37, 0.025, 0.022], '#ac8c57')
}
add([4.37, 1.69, wallZ], [0.055, 0.022, 0.61], '#edbd7c', true)

// Existing expedition volumes sit below the board; give them a lower support.
add([2.86, 0.975, 1.52], [1.26, 0.05, 0.38], '#3e4a50')
for (const x of [2.35, 3.37]) add([x, 0.86, 1.72], [0.045, 0.22, 0.12])

// Outer recesses beside the entrance; keep the board and hanging plant clear.
for (const side of [-1, 1]) {
  const width = side < 0 ? 1.02 : 1.14
  const x = side * 4.08
  // Shelf fronts face the bridge; backing stays in the existing pressure spine.
  for (const y of [0.84, 1.54]) {
    add([x, y, 1.66], [width, 0.045, 0.3], '#718087')
    add([x, y + 0.055, 1.51], [width, 0.025, 0.025], '#ac8c57')
    add([x, y - 0.04, 1.72], [width * 0.82, 0.015, 0.025], '#edbd7c', true)
  }
  for (let i = 0; i < 4; i++) {
    const bx = x - width * 0.32 + i * 0.105
    add(
      [bx, 1.06 + (i % 2) * 0.025, 1.66],
      [0.075, 0.39 + (i % 2) * 0.05, 0.2],
      i % 2 ? '#58634f' : '#263f51',
    )
    add([bx, 1.13, 1.552], [0.048, 0.012, 0.008], '#ac8c57')
  }
  const bx = x + width * 0.14
  add([bx, 1.72, 1.67], [width * 0.48, 0.31, 0.24], '#40535f')
  add([bx, 1.72, 1.544], [width * 0.18, 0.04, 0.016], '#111c24')
  for (const dx of [-0.12, 0.12])
    add([bx + dx, 1.8, 1.538], [0.035, 0.11, 0.018], '#ac8c57')
  add([x, 2.29, 1.74], [width * 0.78, 0.025, 0.035], '#edbd7c', true)
}
