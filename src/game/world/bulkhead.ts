export type BulkheadPhase = 'closed' | 'unlocking' | 'opening' | 'open'

export const BULKHEAD_UNLOCK_SECONDS = 0.35
export const BULKHEAD_OPEN_SECONDS = 1.4
export const BULKHEAD_LEAF_HALF_WIDTH = 0.625
export const BULKHEAD_LEAF_TRAVEL = 1.3
export const BULKHEAD_DEPTH = 5.12

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
