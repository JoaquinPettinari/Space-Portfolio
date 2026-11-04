import { lazy, Suspense, useState } from 'react'

const Game = lazy(() =>
  import('./game/Game').then(({ Game }) => ({ default: Game })),
)

export default function App() {
  const [started, setStarted] = useState(false)
  return (
    <main className="app">
      {started ? (
        <Suspense
          fallback={
            <p className="fallback" role="status">
              Cargando estación…
            </p>
          }
        >
          <Game />
        </Suspense>
      ) : (
        <section className="entry">
          <p>SPACE PORTFOLIO / GREYBOX</p>
          <h1>Explorá la estación</h1>
          <p>Una habitación 3D para recorrer con teclado y mouse.</p>
          <button onClick={() => setStarted(true)}>
            Cargar experiencia 3D
          </button>
        </section>
      )}
    </main>
  )
}
