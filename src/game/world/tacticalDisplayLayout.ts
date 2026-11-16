import { monitorDistance, TERMINAL_SCREENS } from '../interaction/station'

/** Pixel contract shared with TacticalPanel.css: one sidebar and a clear model bay. */
export const TACTICAL_MODEL_BAY = {
  left: 224,
  right: 960,
  top: 78,
  bottom: 420,
} as const
export const TACTICAL_MODEL_TILT = 0.16

/** Fit a centered, rotating hull in the transparent part of the physical UI.
 * Scale is prepared only on camera/viewport changes, never during rotation.
 * The foreground depth is accounted for: moving a model toward the camera
 * enlarges its projection even though its physical dimensions do not change. */
export function tacticalDisplayLayout(
  size: readonly [number, number, number],
  aspect: number,
  verticalFov: number,
) {
  const screen = TERMINAL_SCREENS.tactical
  const pixelsToMetres = screen.display[0] / screen.pixels[0]
  const distance = monitorDistance(aspect, ...screen.frame, verticalFov)
  const depth = 0.22
  const modelDistance = distance - depth
  const x =
    ((TACTICAL_MODEL_BAY.left + TACTICAL_MODEL_BAY.right) / 2 - 480) *
    pixelsToMetres
  const y =
    (270 - (TACTICAL_MODEL_BAY.top + TACTICAL_MODEL_BAY.bottom) / 2) *
    pixelsToMetres
  const position: [number, number, number] = [
    (x * modelDistance) / distance,
    (y * modelDistance) / distance,
    depth,
  ]
  const bounds = {
    left: (TACTICAL_MODEL_BAY.left + 20 - 480) * pixelsToMetres,
    right: (TACTICAL_MODEL_BAY.right - 20 - 480) * pixelsToMetres,
    top: (270 - TACTICAL_MODEL_BAY.top - 38) * pixelsToMetres,
    bottom: (270 - TACTICAL_MODEL_BAY.bottom + 38) * pixelsToMetres,
  }
  const fits = (scale: number) => {
    for (let turn = 0; turn < 32; turn++) {
      const yaw = (turn * Math.PI) / 16
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw)
      const ct = Math.cos(TACTICAL_MODEL_TILT),
        st = Math.sin(TACTICAL_MODEL_TILT)
      for (const sx of [-1, 1])
        for (const sySign of [-1, 1])
          for (const sz of [-1, 1]) {
            const px = (size[0] * sx) / 2,
              py = (size[1] * sySign) / 2,
              pz = (size[2] * sz) / 2
            const rx = px * cy + pz * sy
            const rz = -px * sy + pz * cy
            const ry = py * ct - rz * st
            const tz = py * st + rz * ct
            const away = modelDistance - tz * scale
            if (away <= 0) return false
            const projectedX = ((position[0] + rx * scale) * distance) / away
            const projectedY = ((position[1] + ry * scale) * distance) / away
            if (
              projectedX < bounds.left ||
              projectedX > bounds.right ||
              projectedY < bounds.bottom ||
              projectedY > bounds.top
            )
              return false
          }
    }
    return true
  }
  let low = 0,
    high = 1
  for (let i = 0; i < 12; i++) {
    const middle = (low + high) / 2
    if (fits(middle)) low = middle
    else high = middle
  }
  return { position, scale: low * 0.96 }
}
