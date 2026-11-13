import {
  ENTRY_POWER_POSITION,
  ENTRY_CREW_POSITION,
  ENTRY_CREW_SCREEN,
} from '../world/entryLayout'
import { COMMAND_POSES } from '../world/commandLayout'
import { bridgePoint } from '../world/bridgePlacement'
const BRIDGE_MONITORS = {
  computer: {
    ...COMMAND_POSES.computer,
    position: bridgePoint(COMMAND_POSES.computer.position),
  },
  communications: {
    ...COMMAND_POSES.communications,
    position: bridgePoint(COMMAND_POSES.communications.position),
  },
}
export type StationMode =
  | 'tactical'
  | 'walking'
  | 'computer'
  | 'communications'
  | 'personal'
  | 'arcade'
  | 'photo'
  | 'crew'
export type StationTarget =
  | 'docking'
  | 'tactical'
  | 'computer'
  | 'dossier'
  | 'lighting'
  | 'communications'
  | 'personal'
  | 'arcade'
  | 'photo'
  | 'coffee'
  | 'bulkhead'
  | 'crew'
  | null

export const SCREEN_POSITION = BRIDGE_MONITORS.computer.position
export const COMMUNICATIONS_POSITION = BRIDGE_MONITORS.communications.position
export const PERSONAL_POSITION = bridgePoint([4.35, 1.65, 2.1])
export const ARCADE_POSITION = bridgePoint([-4.35, 1.65, 0.4])
export const COFFEE_POSITION = bridgePoint([-4.25, 0, 3.65])
export const PHOTO_POSITION = bridgePoint([-4.58, 1.75, 2.2])
export const POWER_POSITION = ENTRY_POWER_POSITION
export const CREW_ACCESS_POSITION = ENTRY_CREW_POSITION
export const CREW_ACCESS_ROTATION = 0
export const TABLE_POSITION = bridgePoint([0, 0, 0.5])
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
export const INTERACTION_DISTANCE = 2.8
export const WALL_SCREEN_POSES = {
  communications: BRIDGE_MONITORS.communications,
  personal: {
    position: bridgePoint([4.205, 1.68, 2.1]),
    rotation: -Math.PI / 2,
  },
  arcade: {
    position: bridgePoint([-4.205, 1.68, 0.4]),
    rotation: Math.PI / 2,
  },
  crew: { position: ENTRY_CREW_SCREEN, rotation: CREW_ACCESS_ROTATION },
} as const
export function wallMonitorDistance(aspect: number) {
  return monitorDistance(aspect, 1.3, 1.1)
}
export type TerminalKind =
  'computer' | 'communications' | 'personal' | 'arcade' | 'crew' | 'tactical'

/** Physical display contract, matching current geometry and CSS pixel surfaces.
 * Keep the user's UI layout independent from camera fitting and Html scale.
 */
export const TERMINAL_SCREENS = {
  tactical: {
    position: bridgePoint([-0.55, 1.85, 0.5]),
    rotation: -Math.PI / 2,
    frame: [2.6, 1.6],
    display: [2.4, 1.35],
    pixels: [960, 540],
  },
  computer: {
    ...BRIDGE_MONITORS.computer,
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
  arcade: {
    ...WALL_SCREEN_POSES.arcade,
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
  tactical: terminalView('tactical'),
  computer: terminalView('computer'),
  communications: terminalView('communications'),
  personal: terminalView('personal'),
  arcade: terminalView('arcade'),
  crew: terminalView('crew'),
  photo: { position: bridgePoint([-2.78, 1.75, 2.2]), lookAt: PHOTO_POSITION },
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
  if (target === 'tactical') return 'tactical'
  if (target === 'computer') return 'computer'
  if (target === 'communications') return 'communications'
  if (target === 'personal') return 'personal'
  if (target === 'arcade') return 'arcade'
  if (target === 'photo') return 'photo'
  if (target === 'crew') return 'crew'
  return mode
}
