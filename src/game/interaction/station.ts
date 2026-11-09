export type StationMode =
  'walking' | 'computer' | 'communications' | 'personal' | 'photo' | 'crew'
export type StationTarget =
  | 'computer'
  | 'dossier'
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
export const POWER_POSITION = [-1.4, 1.65, 6.1] as const
export const CREW_ACCESS_POSITION = [2.05, 1.65, 4.65] as const
export const CREW_ACCESS_ROTATION = Math.PI
export const TABLE_POSITION = [0, 0, 0.5] as const
/** Fit the whole physical bezel while leaving readable margins. */
export function monitorDistance(
  aspect: number,
  width = 1.8,
  height = 1.1,
  verticalFov = 65,
) {
  const field = 2 * Math.tan((verticalFov * Math.PI) / 360)
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
export const WALL_SCREEN_POSES = {
  communications: { position: [2.4, 1.65, -3.715], rotation: 0 },
  personal: { position: [4.405, 1.68, 2.1], rotation: -Math.PI / 2 },
  crew: { position: [2.05, 1.68, 4.505], rotation: CREW_ACCESS_ROTATION },
} as const
export const COMMUNICATIONS_FOCUS = [
  2.4,
  1.65,
  -3.715 + monitorDistance(16 / 9),
] as const
export function wallMonitorDistance(aspect: number) {
  return monitorDistance(aspect, 1.3, 1.1)
}
export type TerminalKind = 'computer' | 'communications' | 'personal' | 'crew'

/** Physical display contract, matching current geometry and CSS pixel surfaces.
 * Keep the user's UI layout independent from camera fitting and Html scale.
 */
export const TERMINAL_SCREENS = {
  computer: {
    position: SCREEN_POSITION,
    rotation: 0,
    frame: [1.8, 1.1],
    display: [1.6, 0.9],
    pixels: [960, 540],
  },
  communications: {
    ...WALL_SCREEN_POSES.communications,
    frame: [1.8, 1.1],
    display: [1.6, 0.9],
    pixels: [960, 540],
  },
  personal: {
    ...WALL_SCREEN_POSES.personal,
    frame: [1.3, 1.1],
    display: [1.1, 0.8],
    pixels: [770, 560],
  },
  crew: {
    ...WALL_SCREEN_POSES.crew,
    frame: [1.3, 1.1],
    display: [1.1, 0.8],
    pixels: [770, 560],
  },
} as const

/** Drei Html transform maps one CSS pixel to distanceFactor / 400 world units.
 * Uniform fit preserves proportions and leaves a margin if aspect ratios differ.
 */
export function terminalHtmlScale(kind: TerminalKind) {
  const { display, pixels } = TERMINAL_SCREENS[kind]
  return 400 * Math.min(display[0] / pixels[0], display[1] / pixels[1])
}

function terminalView(kind: TerminalKind) {
  const screen = TERMINAL_SCREENS[kind]
  const distance = monitorDistance(16 / 9, ...screen.frame)
  return {
    position: [
      screen.position[0] + Math.sin(screen.rotation) * distance,
      screen.position[1],
      screen.position[2] + Math.cos(screen.rotation) * distance,
    ] as const,
    lookAt: screen.position,
  }
}
const views = {
  computer: terminalView('computer'),
  communications: terminalView('communications'),
  personal: terminalView('personal'),
  crew: terminalView('crew'),
  photo: { position: [-2.98, 1.75, 2.2] as const, lookAt: PHOTO_POSITION },
} as const

/** Writes into the caller-owned vector: no allocations during frame updates. */
export function setStationFocus(
  target: { x: number; y: number; z: number },
  mode: Exclude<StationMode, 'walking'>,
  aspect: number,
  verticalFov = 65,
) {
  if (mode === 'photo') {
    const [x, y, z] = views.photo.position
    target.x = x
    target.y = y
    target.z = z
    return
  }
  const screen = TERMINAL_SCREENS[mode]
  const distance = monitorDistance(
    aspect > 0 && Number.isFinite(aspect) ? aspect : 1,
    ...screen.frame,
    verticalFov,
  )
  target.x = screen.position[0] + Math.sin(screen.rotation) * distance
  target.y = screen.position[1]
  target.z = screen.position[2] + Math.cos(screen.rotation) * distance
}

export function stationView(mode: Exclude<StationMode, 'walking'>) {
  return views[mode]
}

export function interactionMode(
  mode: StationMode,
  target: StationTarget,
): StationMode {
  if (target === 'computer') return 'computer'
  if (target === 'communications') return 'communications'
  if (target === 'personal') return 'personal'
  if (target === 'photo') return 'photo'
  if (target === 'crew') return 'crew'
  return mode
}
