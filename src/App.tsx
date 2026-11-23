import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useDockingIntro } from './game/intro/useDockingIntro'
import { DockingOverlay } from './game/intro/DockingOverlay'
import { PortfolioContent } from './portfolio/PortfolioContent'
import { StationBoundary } from './StationBoundary'
import '@fontsource/rajdhani/600.css'
import '@fontsource/rajdhani/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/share-tech-mono/400.css'

const Game = lazy(() =>
  import('./game/Game').then(({ Game }) => ({ default: Game })),
)

type View = 'station' | 'portfolio'

function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [view, setView] = useState<View>('station')
  const intro = useDockingIntro(view !== 'station')
  const [available] = useState(supportsWebGL)
  const [stationFailed, setStationFailed] = useState(false)
  const interiorVisibility =
    stationFailed || intro.complete || intro.phase === 'revealing'
      ? 'visible'
      : 'hidden'
  const quickButton = useRef<HTMLButtonElement>(null)
  const portfolioTitle = useRef<HTMLHeadingElement>(null)
  const restoreFocus = useRef(false)

  useEffect(() => {
    if (view === 'portfolio') portfolioTitle.current?.focus()
    else if (restoreFocus.current) {
      // A terminal or tablet may still be open in the preserved station.
      // Resume inside that dialog rather than leaving focus outside aria-modal.
      const dialogControl =
        view === 'station'
          ? document.querySelector<HTMLElement>(
              '.station-shell [role="dialog"] button',
            )
          : null
      ;(dialogControl ?? quickButton.current)?.focus()
      restoreFocus.current = false
    }
  }, [view])

  const openPortfolio = () => {
    if (document.pointerLockElement) document.exitPointerLock()
    setView('portfolio')
  }
  const closePortfolio = () => {
    restoreFocus.current = true
    setView('station')
  }

  return (
    <main className={`app app--${view}`}>
      {available && (
        <div
          className="station-shell"
          hidden={view !== 'station'}
          inert={view !== 'station'}
        >
          {/* Visibility is a second, independent barrier: warmup draws must never
              expose the interior before the opaque intro opens. Layout stays sized. */}
          <div
            style={{
              width: '100%',
              height: '100%',
              visibility: interiorVisibility,
            }}
            data-interior-visibility={interiorVisibility}
          >
            <StationBoundary
              onUnavailable={() => {
                setStationFailed(true)
              }}
            >
              <Suspense fallback={null}>
                {intro.shouldLoadGame && (
                  <Game
                    suspended={view !== 'station'}
                    onAccessiblePortfolio={openPortfolio}
                    introComplete={intro.complete}
                    introRevealing={intro.phase === 'revealing'}
                    prepareInterior={
                      intro.reducedMotion ||
                      (intro.phase !== 'loading-exterior' &&
                        intro.phase !== 'cinematic' &&
                        intro.phase !== 'fading' &&
                        intro.phase !== 'failed')
                    }
                    onInteriorReady={intro.setInteriorReady}
                  />
                )}
              </Suspense>
            </StationBoundary>
          </div>
          {!stationFailed && <DockingOverlay intro={intro} />}
        </div>
      )}
      {view === 'station' && (!available || stationFailed) && (
        <>
          {!available && (
            <p className="fallback" role="status">
              3D mode is unavailable in this browser. All professional
              information is available through Quick Portfolio Access.
            </p>
          )}
          <button
            className="quick-access-button"
            ref={quickButton}
            onClick={openPortfolio}
          >
            Quick Portfolio Access
          </button>
        </>
      )}
      {view === 'portfolio' && (
        <section
          className="quick-portfolio"
          aria-labelledby="quick-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              closePortfolio()
            }
          }}
        >
          <header className="quick-portfolio-header">
            <div>
              <p className="eyebrow">CRUZ DEL SUR / PUBLIC RECORDS</p>
              <h1 id="quick-title" ref={portfolioTitle} tabIndex={-1}>
                Quick Portfolio Access
              </h1>
            </div>
            <button onClick={closePortfolio}>Back to station</button>
          </header>
          <p className="quick-intro">
            Professional information, directly. No missions or game controls
            required.
          </p>
          <PortfolioContent headingId="quick-content-title" />
        </section>
      )}
    </main>
  )
}
