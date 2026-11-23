export type IntroPhase =
  | 'loading-exterior'
  | 'cinematic'
  | 'fading'
  | 'waiting-interior'
  | 'revealing'
  | 'complete'
  | 'failed'
export type IntroEvent =
  | 'playing'
  | 'ended'
  | 'fade-ended'
  | 'ready'
  | 'unready'
  | 'reveal-ended'
  | 'error'
  | 'retry'
  | 'skip'
/** Playback and compositor completion events, never a second cinematic clock. */
export function advanceIntroSequence(
  phase: IntroPhase,
  event: IntroEvent,
  interiorReady: boolean,
): IntroPhase {
  if (phase === 'complete') return phase
  if (event === 'error')
    return phase === 'loading-exterior' || phase === 'cinematic'
      ? 'failed'
      : phase
  if (event === 'retry') return 'loading-exterior'
  if (event === 'skip') return interiorReady ? 'revealing' : 'waiting-interior'
  if (event === 'unready' && phase === 'revealing') return 'waiting-interior'
  if (event === 'playing' && phase === 'loading-exterior') return 'cinematic'
  if (
    event === 'ended' &&
    (phase === 'cinematic' || phase === 'loading-exterior')
  )
    return 'fading'
  if (event === 'fade-ended' && phase === 'fading')
    return interiorReady ? 'revealing' : 'waiting-interior'
  if (event === 'ready' && phase === 'waiting-interior') return 'revealing'
  if (event === 'reveal-ended' && phase === 'revealing' && interiorReady)
    return 'complete'
  return phase
}
