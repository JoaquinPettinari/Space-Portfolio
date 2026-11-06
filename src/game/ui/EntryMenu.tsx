type EntryMenuProps = {
  active: boolean
  ready: boolean
  error: string
}

export function EntryMenu({ active, ready, error }: EntryMenuProps) {
  return (
    <section
      className="capture-hint"
      hidden={active || !ready}
      aria-label="Mouse controls"
    >
      <button id="enter-station" data-capture-pointer disabled={!ready}>
        Click to control the mouse
      </button>
      <p>Escape releases the cursor · E to interact</p>
      <p role="status">{error}</p>
    </section>
  )
}
