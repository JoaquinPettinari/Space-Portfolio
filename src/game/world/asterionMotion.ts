import type { Vector3 } from 'three'

export const ASTERION_MAX_DRIFT = 13

/** Use simulation time, never wall time: returning from a hidden tab or a long
 * compilation frame must not advance the exterior by the time spent away. */
export function advanceExteriorTime(
  elapsed: number,
  delta: number,
  paused: boolean,
) {
  return paused || delta <= 0 || delta > 0.25 || !Number.isFinite(delta)
    ? elapsed
    : elapsed + delta
}

/** Translation preserves baked terminators and the planet's shadow on its rings.
 * Both closed curves start at zero; no wrapping, respawning or per-frame allocation. */
export function sampleAsterionDrift(
  elapsed: number,
  worlds: Vector3,
  debris: Vector3,
) {
  const theta = elapsed * ((Math.PI * 2) / 240)
  const phi = elapsed * ((Math.PI * 2) / 120)
  worlds.set(
    3.6 * Math.sin(theta),
    0.2 * Math.sin(theta),
    1.2 * (Math.cos(theta) - 1),
  )
  debris.set(6 * Math.sin(phi), 0.5 * Math.sin(phi), 3 * (Math.cos(phi) - 1))
}
