type EntryMenuProps = {
  active: boolean
  ready: boolean
  error: string
}

export function EntryMenu({ active, ready, error }: EntryMenuProps) {
  return (
    <section className="entry" hidden={active} aria-labelledby="entry-title">
      <p>PROTOTIPO / v0.2</p>
      <h1 id="entry-title">Entrá a la estación</h1>
      <p>
        Movete con WASD y mirá con el mouse.
        <br />
        Escape libera el cursor y pausa la experiencia.
      </p>
      <button id="enter-station" disabled={!ready}>
        {ready ? 'Entrar / continuar' : 'Cargando física…'}
      </button>
      <p className="hint">Por ahora necesitás teclado y mouse.</p>
      <p role="status">{error}</p>
    </section>
  )
}
