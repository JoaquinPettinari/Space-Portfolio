export type StationMode =
  'walking' | 'computer' | 'hologram' | 'communications' | 'personal' | 'photo'
export type StationTarget =
  | 'computer'
  | 'dossier'
  | 'hologram'
  | 'lighting'
  | 'communications'
  | 'personal'
  | 'photo'
  | 'coffee'
  | 'bulkhead'
  | null

export const SCREEN_POSITION = [0, 1.55, -3.57] as const
export const FOCUS_POSITION = [0, 1.55, -2.55] as const
/** Keep the whole 1.65 m bezel within 85% of a narrow viewport (65° vFOV).
 * Desktop retains the existing pose; only the observation camera moves. */
export function archiveFocusZ(aspect: number) {
  const distance = 1.65 / (2 * Math.tan((65 * Math.PI) / 360) * aspect * 0.85)
  return Math.max(FOCUS_POSITION[2], -3.535 + distance)
}
export const INTERACTION_DISTANCE = 2.8
export const HOLOGRAM_DISTANCE = 4.5
export const HOLOGRAM_FOCUS_POSITION = [2.15, 1.8, 2.8] as const
export const HOLOGRAM_LOOK_AT = [2.15, 1.9, 0] as const
export const COMMUNICATIONS_POSITION = [-4.7, 1.65, 1] as const
export const COMMUNICATIONS_FOCUS = [-2.9, 1.65, 1] as const

export const PERSONAL_POSITION = [3.25, 1.65, 4.65] as const
const views = {
  computer: { position: FOCUS_POSITION, lookAt: SCREEN_POSITION },
  hologram: { position: HOLOGRAM_FOCUS_POSITION, lookAt: HOLOGRAM_LOOK_AT },
  communications: {
    position: COMMUNICATIONS_FOCUS,
    lookAt: COMMUNICATIONS_POSITION,
  },
  personal: { position: [3.25, 1.65, 2.9] as const, lookAt: PERSONAL_POSITION },
  photo: {
    position: [-2.9, 1.7, -1.7] as const,
    lookAt: [-4.7, 1.7, -1.7] as const,
  },
} as const
export function stationView(mode: Exclude<StationMode, 'walking'>) {
  return views[mode]
}

export function interactionMode(
  mode: StationMode,
  target: StationTarget,
): StationMode {
  if (target === 'computer') return 'computer'
  if (target === 'hologram') return 'hologram'
  if (target === 'communications') return 'communications'
  if (target === 'personal') return 'personal'
  if (target === 'photo') return 'photo'
  return mode
}
