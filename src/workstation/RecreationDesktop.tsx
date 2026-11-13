import { useState } from 'react'
import { CommandTerminal } from './CommandTerminal'
import './PersonalDesktop.css'

/** Optional local exercise, deliberately unrelated to power or mission progress. */
export function RecreationDesktop({
  onBrewCoffee,
}: {
  onBrewCoffee: () => void
}) {
  const [app, setApp] = useState<'command' | 'signal'>('command')
  const [channels, setChannels] = useState([false, false, false, false])
  const [moves, setMoves] = useState(0)
  const solved = channels.every(Boolean)
  return (
    <div className="personal-desktop personal-desktop--active">
      <div
        className="personal-desktop-icons"
        role="group"
        aria-label="Recreation applications"
      >
        <button
          type="button"
          aria-pressed={app === 'command'}
          onClick={() => setApp('command')}
        >
          Command Terminal
        </button>
        <button
          type="button"
          aria-pressed={app === 'signal'}
          onClick={() => setApp('signal')}
        >
          Signal Puzzle
        </button>
      </div>
      <section
        className="personal-desktop-window"
        aria-label={app === 'command' ? 'Command Terminal' : 'Signal Puzzle'}
      >
        {app === 'command' ? (
          <CommandTerminal onBrewCoffee={onBrewCoffee} />
        ) : (
          <div className="personal-desktop-document">
            <h2>Signal Puzzle</h2>
            <p>
              Turn all four channels on. Each switch flips itself and the next
              channel; channel 4 wraps to channel 1.
            </p>
            <p>
              Optional simulation · No effect on station systems or missions.
            </p>
            <div role="group" aria-label="Signal channels">
              {channels.map((on, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  disabled={solved}
                  onClick={() => {
                    setChannels((current) =>
                      current.map((value, index) =>
                        index === i || index === (i + 1) % 4 ? !value : value,
                      ),
                    )
                    setMoves((current) => current + 1)
                  }}
                >
                  Channel {i + 1}: {on ? 'On' : 'Off'}
                </button>
              ))}
            </div>
            <p role="status">
              {solved ? 'Signal aligned!' : 'Signal incomplete.'} Moves: {moves}
            </p>
            <button
              type="button"
              onClick={() => {
                setChannels([false, false, false, false])
                setMoves(0)
              }}
            >
              Reset puzzle
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
