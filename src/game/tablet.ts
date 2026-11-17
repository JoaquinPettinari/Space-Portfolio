/** Mission/map reader stays held while FPS controls retain mouse ownership. */
export type TabletMode = 'lowered' | 'held'
export type TabletEvent = 'toggle' | 'resume' | 'dismiss'

export function tabletTransition(
  mode: TabletMode,
  event: TabletEvent,
): TabletMode {
  if (event === 'dismiss') return 'lowered'
  if (event === 'toggle') return mode === 'lowered' ? 'held' : 'lowered'
  return mode
}

export function tabletAllowsMovement(mode: TabletMode) {
  return mode === 'held' || mode === 'lowered'
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
