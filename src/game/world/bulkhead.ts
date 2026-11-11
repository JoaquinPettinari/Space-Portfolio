import { ENTRY_OFFSET } from './bridgeLayout'
export type BulkheadPhase = 'closed' | 'unlocking' | 'opening' | 'open'

export const BULKHEAD_UNLOCK_SECONDS = 0.35
export const BULKHEAD_OPEN_SECONDS = 1.4
export const BULKHEAD_LEAF_HALF_WIDTH = 0.685
export const BULKHEAD_LEAF_TRAVEL = 1.37
export const BULKHEAD_DEPTH = 5.65 + ENTRY_OFFSET

/** Local elapsed time only; the authoritative phase belongs to the session. */
export function advanceBulkheadElapsed(
  phase: BulkheadPhase,
  elapsed: number,
  delta: number,
  reducedMotion: boolean,
) {
  if (phase === 'closed' || phase === 'open') return 0
  const duration =
    phase === 'unlocking' ? BULKHEAD_UNLOCK_SECONDS : BULKHEAD_OPEN_SECONDS
  if (reducedMotion) return duration
  return Math.min(duration, elapsed + Math.max(0, delta))
}

export function nextBulkheadPhase(
  phase: BulkheadPhase,
  elapsed: number,
): BulkheadPhase {
  if (phase === 'unlocking' && elapsed >= BULKHEAD_UNLOCK_SECONDS)
    return 'opening'
  if (phase === 'opening' && elapsed >= BULKHEAD_OPEN_SECONDS) return 'open'
  return phase
}

/** Both visual leaves and colliders use this same kinematic-body displacement. */
export function bulkheadLeafOffset(phase: BulkheadPhase, elapsed: number) {
  if (phase === 'open') return BULKHEAD_LEAF_TRAVEL
  if (phase !== 'opening') return 0
  const progress = Math.max(0, Math.min(1, elapsed / BULKHEAD_OPEN_SECONDS))
  return BULKHEAD_LEAF_TRAVEL * progress * progress * (3 - 2 * progress)
}

// Sealed wall pockets around the GLB leaf sweep: X to ±2.74, Z 5.53–5.89.
export const BULKHEAD_POCKET_PANELS = [
  { at: [2.095, 1.3, 5.4], size: [1.51, 2.6, 0.12] },
  { at: [2.095, 1.3, 5.99], size: [1.51, 2.6, 0.16] },
  { at: [2.85, 1.3, 5.695], size: [0.12, 2.6, 0.71] },
  { at: [2.095, 2.62, 5.695], size: [1.63, 0.2, 0.71] },
  { at: [2.095, -0.08, 5.695], size: [1.63, 0.16, 0.71] },
] as const

/** Credentials authorize the existing door; guidance never gates it. */
export function requestBridgeAccess(
  phase: BulkheadPhase,
  identified: boolean,
): BulkheadPhase {
  return phase === 'closed' && identified ? 'unlocking' : phase
}
