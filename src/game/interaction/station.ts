export type StationMode =
  | 'walking'
  | 'computer'
  | 'hologram'
  | 'communications'
  | 'personal'
  | 'photo'
  | 'crew'
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
  | 'crew'
  | null

export const SCREEN_POSITION = [-2.4, 1.65, -3.715] as const
export const COMMUNICATIONS_POSITION = [2.4, 1.65, -3.82] as const
export const PERSONAL_POSITION = [4.55, 1.65, 2.1] as const
export const COFFEE_POSITION = [-4.25, 0, 3.65] as const
export const PHOTO_POSITION = [-4.78, 1.75, 2.2] as const
export const CREW_ACCESS_POSITION = [-1.4, 1.65, 7.3] as const
export const TABLE_POSITION = [0, 0, 0.5] as const
/** Fit the whole physical bezel while leaving readable margins. */
export function monitorDistance(aspect: number, width = 1.8, height = 1.1) {
  const field = 2 * Math.tan((65 * Math.PI) / 360)
  return Math.max(height / (field * 0.82), width / (field * aspect * 0.85))
}
export const FOCUS_POSITION = [
  -2.4,
  1.65,
  -3.715 + monitorDistance(16 / 9),
] as const
export function archiveFocusZ(aspect: number) {
  return SCREEN_POSITION[2] + monitorDistance(aspect)
}
export const INTERACTION_DISTANCE = 2.8
export const HOLOGRAM_DISTANCE = 4.5
export const HOLOGRAM_FOCUS_POSITION = [0, 1.8, 3.1] as const
export const HOLOGRAM_LOOK_AT = [0, 1.6, 0.5] as const
export const WALL_SCREEN_POSES = {
  communications: { position: [2.4, 1.65, -3.715], rotation: 0 },
  personal: { position: [4.405, 1.68, 2.1], rotation: -Math.PI / 2 },
  crew: { position: [-1.255, 1.68, 7.3], rotation: Math.PI / 2 },
} as const
export const COMMUNICATIONS_FOCUS = [
  2.4,
  1.65,
  -3.715 + monitorDistance(16 / 9),
] as const
export function wallMonitorDistance(aspect: number) {
  return monitorDistance(aspect, 1.3, 1.1)
}
const views = {
  crew: {
    position: [-1.255 + wallMonitorDistance(16 / 9), 1.68, 7.3] as const,
    lookAt: WALL_SCREEN_POSES.crew.position,
  },
  computer: { position: FOCUS_POSITION, lookAt: SCREEN_POSITION },
  hologram: { position: HOLOGRAM_FOCUS_POSITION, lookAt: HOLOGRAM_LOOK_AT },
  communications: {
    position: COMMUNICATIONS_FOCUS,
    lookAt: WALL_SCREEN_POSES.communications.position,
  },
  personal: {
    position: [4.405 - wallMonitorDistance(16 / 9), 1.68, 2.1] as const,
    lookAt: WALL_SCREEN_POSES.personal.position,
  },
  photo: { position: [-2.98, 1.75, 2.2] as const, lookAt: PHOTO_POSITION },
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
  if (target === 'crew') return 'crew'
  return mode
}
