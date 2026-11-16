import { useId, useEffect, useRef } from 'react'
import { Music2, Play, Pause, SkipForward, Radio } from 'lucide-react'
import { RADIO_TRACKS } from '../radioMusic'
import type { useShipRadio } from '../useShipRadio'
import { trapDialogFocus } from './dialogFocus'
import './RadioPanel.css'

export function RadioPanel({
  radio,
  onClose,
}: {
  radio: ReturnType<typeof useShipRadio>
  onClose: () => void
}) {
  const id = useId()
  const play = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    play.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section
      className="ship-radio-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onKeyDown={trapDialogFocus}
    >
      <header>
        <Radio size={23} aria-hidden="true" />
        <h1 id={id}>CDS Radio</h1>
        <span>STEREO · 01</span>
      </header>
      <div className="radio-now-playing">
        <Music2 aria-hidden="true" />
        <div>
          <small>ORIGINAL INSTRUMENTALS</small>
          <strong>{RADIO_TRACKS[radio.track].title}</strong>
          <p>Lo-fi / Deep space</p>
        </div>
      </div>
      <div
        className="radio-spectrum"
        data-playing={radio.playing}
        aria-hidden="true"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ height: `${14 + ((i * 23) % 50)}%` }} />
        ))}
      </div>
      <div className="radio-transport">
        <button
          ref={play}
          aria-label={radio.playing ? 'Pause radio' : 'Play radio'}
          disabled={!radio.supported || radio.pending}
          onClick={() => void radio.toggle()}
        >
          {radio.playing ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}{' '}
          {radio.playing ? 'Pause' : 'Play'}
        </button>
        <button aria-label="Next radio track" onClick={radio.next}>
          <SkipForward aria-hidden="true" /> Next
        </button>
        <label>
          Volume
          <input
            aria-label="Radio volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={radio.volume}
            onChange={(e) => radio.changeVolume(Number(e.target.value))}
          />
        </label>
      </div>
      <footer>
        <p role="status">
          {radio.error ||
            (!radio.supported
              ? 'Audio unavailable in this browser.'
              : radio.playing
                ? 'ON AIR'
                : 'Press play to tune in')}
        </p>
        <button data-capture-pointer onClick={onClose}>
          Leave radio
        </button>
      </footer>
    </section>
  )
}
