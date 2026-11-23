import gestureTiming from './world/gestureTiming.json'

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
  const duration =
    target > value ? gestureTiming.tablet.raise : gestureTiming.tablet.lower
  const step = Math.max(0, delta) / duration
  return target > value
    ? Math.min(target, value + step)
    : Math.max(target, value - step)
}
