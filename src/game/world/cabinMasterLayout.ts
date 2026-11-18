import shellLayout from './arrivalShellLayout.json' with { type: 'json' }

const technicalFrontX = 3.56
const technicalBackX = shellLayout.wallX + 0.01
const technicalStartZ = 12.8265
const technicalEndZ = 17.72
const endPanelThickness = 0.08

/** Close the service recess at both ends, flush with the cabinet fronts. */
export const CABIN_TECHNICAL_END_PANELS = [
  [shellLayout.startZ, technicalStartZ],
  [technicalEndZ, shellLayout.endZ],
].map(([start, end]) => ({
  position: [
    technicalFrontX + endPanelThickness / 2,
    shellLayout.roofY / 2,
    (start + end) / 2,
  ] as const,
  size: [endPanelThickness, shellLayout.roofY, end - start] as const,
}))

/** World metres, matched to the Blender master. Decorations never generate trimesh physics. */
export const CABIN_MASTER_COLLIDERS = [
  {
    id: 'observation-ledge',
    position: [-4.43, 0.39, 15.15],
    halfSize: [0.52, 0.39, 2.85],
  },
  {
    id: 'eva-display-and-locker',
    position: [-2.76, 1.36, 17.815],
    halfSize: [1.17, 1.36, 0.605],
  },
  {
    id: 'technical-wall',
    position: [
      (technicalFrontX + technicalBackX) / 2,
      shellLayout.roofY / 2,
      (shellLayout.startZ + shellLayout.endZ) / 2,
    ],
    halfSize: [
      (technicalBackX - technicalFrontX) / 2,
      shellLayout.roofY / 2,
      (shellLayout.endZ - shellLayout.startZ) / 2,
    ],
  },
] as const

export const CABIN_MASTER_FLOOR = {
  position: [0, -0.1, 15.14],
  halfSize: [4.95, 0.1, 3.28],
} as const
