import { bridgePoint } from './bridgePlacement'

/** Physical tabletop, independent from the upright tactical interface. */
export const TACTICAL_TABLE_SURFACE = {
  position: bridgePoint([0, 1.074, 0.5]),
  size: [1.78, 2.38] as const,
  pitch: -Math.PI / 2,
}

/** Pixel contract shared with TacticalPanel.css. */
export const TACTICAL_MODEL_BAY = {
  left: 244,
  right: 716,
  top: 94,
  bottom: 440,
} as const
export const TACTICAL_MODEL_ANCHOR = bridgePoint([0, 1.62, 0.5])
export const TACTICAL_MODEL_TILT = 0.16
export const TACTICAL_MODEL_SCALE = 0.65
const display = [2.7, 1.51875] as const
const pixels = [960, 540] as const
const rotation = -Math.PI / 2
const bayX =
  ((TACTICAL_MODEL_BAY.left + TACTICAL_MODEL_BAY.right - pixels[0]) / 2) *
  (display[0] / pixels[0])
const bayY =
  ((pixels[1] - TACTICAL_MODEL_BAY.top - TACTICAL_MODEL_BAY.bottom) / 2) *
  (display[1] / pixels[1])

/** Align the UI's clear bay to the fixed projector, rather than moving the ship
 * into the UI. Its pivot lies on this plane, independent of aspect and FOV. */
export const TACTICAL_SCREEN = {
  position: [
    TACTICAL_MODEL_ANCHOR[0] - Math.cos(rotation) * bayX,
    TACTICAL_MODEL_ANCHOR[1] - bayY,
    TACTICAL_MODEL_ANCHOR[2] + Math.sin(rotation) * bayX,
  ] as const,
  rotation,
  frame: [2.925, 1.8] as const,
  display,
  pixels,
}
