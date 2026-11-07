import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Loading } from './game/ui/Loading'
import { PortfolioContent } from './portfolio/PortfolioContent'
import { StationBoundary } from './StationBoundary'

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
  const [available] = useState(supportsWebGL)
  const [paused, setPaused] = useState(false)
  const [stationFailed, setStationFailed] = useState(false)
  const archiveRef = useRef<{ openArchive: () => void }>(null)
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
          <StationBoundary
            onUnavailable={() => {
              setStationFailed(true)
              setPaused(true)
            }}
          >
            <Suspense fallback={<Loading />}>
              <Game
                suspended={view !== 'station'}
                onPauseChange={setPaused}
                archiveRef={archiveRef}
                onAccessiblePortfolio={openPortfolio}
              />
            </Suspense>
          </StationBoundary>
        </div>
      )}
      {view === 'station' && (!available || paused) && (
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
            onClick={() => {
              if (!available || stationFailed) openPortfolio()
              else archiveRef.current?.openArchive()
            }}
          >
            Quick Portfolio Access
          </button>
          {available && !stationFailed && (
            <button
              className="accessible-portfolio-button"
              onClick={openPortfolio}
            >
              Accessible HTML portfolio
            </button>
          )}
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
