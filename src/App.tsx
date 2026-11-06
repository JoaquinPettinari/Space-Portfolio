import { lazy, Suspense } from 'react'
import { Loading } from './game/ui/Loading'

const Game = lazy(() =>
  import('./game/Game').then(({ Game }) => ({ default: Game })),
)

export default function App() {
  return (
    <main className="app">
      <Suspense fallback={<Loading />}>
        <Game />
      </Suspense>
    </main>
  )
}
