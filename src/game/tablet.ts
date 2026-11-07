/** Held mode keeps real FPS input. Focused mode is an explicit cursor handoff. */
export type TabletMode = 'lowered' | 'held' | 'focused'
export type TabletEvent = 'toggle' | 'focus' | 'resume' | 'dismiss'

export function tabletTransition(
  mode: TabletMode,
  event: TabletEvent,
): TabletMode {
  if (event === 'dismiss') return 'lowered'
  if (event === 'toggle') return mode === 'lowered' ? 'held' : 'lowered'
  if (event === 'focus') return mode === 'held' ? 'focused' : mode
  return mode === 'focused' ? 'held' : mode
}

export function tabletAllowsMovement(mode: TabletMode) {
  return mode !== 'focused'
}

/** Bounded, frame-rate independent raise/lower interpolation. */
export function advanceTabletPose(
  value: number,
  target: number,
  delta: number,
  reducedMotion: boolean,
) {
  if (reducedMotion) return target
  const next =
    value + (target - value) * (1 - Math.exp(-12 * Math.max(0, delta)))
  return Math.abs(target - next) < 0.001 ? target : next
}
