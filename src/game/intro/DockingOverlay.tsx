import type { DockingIntroController } from './useDockingIntro'
import './DockingOverlay.css'

export function DockingOverlay({ intro }: { intro: DockingIntroController }) {
  const {
    phase,
    reducedMotion,
    paused,
    playbackBlocked,
    videoRef,
    videoAttempt,
    onVideoPlaying,
    onVideoProgress,
    onVideoEnded,
    onVideoError,
    onVideoMetadata,
    onPresentationEnd,
    playVideo,
    retryVideo,
    continueWithoutVideo,
  } = intro
  if (phase === 'complete') return null
  const status =
    phase === 'waiting-interior'
      ? 'INITIALIZING SYSTEMS'
      : phase === 'loading-exterior' && !reducedMotion
        ? 'PREPARING APPROACH'
        : null
  return (
    <div
      className="docking-intro"
      role="region"
      aria-label="Docking introduction"
      data-intro-phase={phase}
      data-paused={paused}
      data-reduced-motion={reducedMotion}
      onAnimationEnd={(event) => onPresentationEnd(event.animationName)}
    >
      {phase !== 'revealing' &&
        (reducedMotion ? (
          <img
            className="docking-intro__poster"
            src="/video/circular-arrival-poster.jpg"
            alt="PAMPA-07 approaching the Cruz del Sur circular docking entrance"
          />
        ) : (
          <video
            key={videoAttempt}
            ref={videoRef}
            className="docking-intro__video"
            src="/video/circular-arrival-intro.mp4"
            poster="/video/circular-arrival-poster.jpg"
            muted
            playsInline
            preload="auto"
            onPlaying={onVideoPlaying}
            onTimeUpdate={() => {
              onVideoPlaying()
              onVideoProgress()
            }}
            onProgress={onVideoProgress}
            onCanPlayThrough={onVideoProgress}
            onLoadedMetadata={onVideoMetadata}
            onEnded={onVideoEnded}
            onError={onVideoError}
            aria-label="PAMPA-07 docking arrival"
          />
        ))}
      <div className="docking-intro__fade" aria-hidden="true" />
      <div
        className="docking-intro__panel docking-intro__panel--left"
        aria-hidden="true"
      />
      <div
        className="docking-intro__panel docking-intro__panel--right"
        aria-hidden="true"
      />
      {status && (
        <p className="docking-intro__status" role="status">
          {status}
        </p>
      )}
      {phase === 'failed' ? (
        <div className="docking-intro__actions" role="alert">
          <p>The introduction could not be played.</p>
          <button onClick={retryVideo}>Retry introduction</button>
          <button onClick={continueWithoutVideo}>
            Continue without introduction
          </button>
        </div>
      ) : (
        playbackBlocked &&
        (phase === 'loading-exterior' || phase === 'cinematic') && (
          <div className="docking-intro__actions">
            <button onClick={playVideo}>Play introduction</button>
            <button onClick={continueWithoutVideo}>
              Continue without introduction
            </button>
          </div>
        )
      )}
      {phase === 'cinematic' && (
        <p className="docking-intro__caption">
          PAMPA-07 · CRUZ DEL SUR
          <br />
          <span>DOCKING APPROACH</span>
        </p>
      )}
    </div>
  )
}
