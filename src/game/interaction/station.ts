export type StationMode = 'walking' | 'computer' | 'hologram'
export type StationTarget =
  'computer' | 'dossier' | 'hologram' | 'lighting' | null

export const SCREEN_POSITION = [0, 1.55, -3.57] as const
export const FOCUS_POSITION = [0, 1.55, -2.55] as const
export const INTERACTION_DISTANCE = 2.8
export const HOLOGRAM_DISTANCE = 4.5
export const HOLOGRAM_FOCUS_POSITION = [2.15, 1.8, 2.8] as const
export const HOLOGRAM_LOOK_AT = [2.15, 1.9, 0] as const

export function interactionMode(
  mode: StationMode,
  target: StationTarget,
): StationMode {
  if (target === 'computer') return 'computer'
  if (target === 'hologram') return 'hologram'
  return mode
}
