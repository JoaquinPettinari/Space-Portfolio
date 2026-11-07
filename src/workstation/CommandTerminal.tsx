import { useEffect, useId, useRef, useState } from 'react'
import { profile } from '../data/portfolio'

const HISTORY_LIMIT = 20
const COMMAND_LIMIT = 200
type CommandResult = { reply: string; effect?: 'clear' | 'coffee' }

/** A fictional command whitelist, never a shell or JavaScript evaluator. */
function evaluateCommand(input: string): CommandResult {
  switch (input.trim().toLowerCase()) {
    case 'help':
      return {
        reply:
          'Available commands: help, whoami, status, clear, npm install coffee.',
      }
    case 'whoami':
      return {
        reply: `${profile.name} · ${profile.role} · ${profile.location}`,
      }
    case 'status':
      return {
        reply:
          'Local workstation ready. This is a fictional terminal; no external systems are connected.',
      }
    case 'clear':
      return { reply: '', effect: 'clear' }
    case 'npm install coffee':
      return {
        reply:
          'Coffee request sent to the station dispenser. No software was installed.',
        effect: 'coffee',
      }
    default:
      return {
        reply: 'Unknown command. Type help to see the available commands.',
      }
  }
}

export function CommandTerminal({
  onBrewCoffee,
}: {
  onBrewCoffee?: () => void
}) {
  const id = useId()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<
    { id: number; command: string; reply: string }[]
  >([])
  const sequence = useRef(0)
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (history.length && document.activeElement === field.current)
      field.current?.scrollIntoView?.({ block: 'nearest' })
  }, [history])
  return (
    <div className="command-terminal">
      <p>
        Local simulation · Type help. Commands affect this fictional station
        only.
      </p>
      <div
        role="log"
        aria-label="Command output"
        aria-live="polite"
        aria-relevant="additions"
        className="command-output"
      >
        {history.map((entry) => (
          <div key={entry.id}>
            <p>&gt; {entry.command}</p>
            <p>{entry.reply}</p>
          </div>
        ))}
      </div>
      <form
        aria-label="Station command terminal"
        onSubmit={(event) => {
          event.preventDefault()
          const command = input.slice(0, COMMAND_LIMIT).trim()
          if (!command) return
          const result = evaluateCommand(command)
          if (result.effect === 'clear') setHistory([])
          else {
            if (result.effect === 'coffee') onBrewCoffee?.()
            const reply =
              result.effect === 'coffee' && !onBrewCoffee
                ? 'Coffee dispenser is not connected to this workstation.'
                : result.reply
            const entry = { id: sequence.current++, command, reply }
            setHistory((entries) => [...entries, entry].slice(-HISTORY_LIMIT))
          }
          setInput('')
          field.current?.focus()
        }}
      >
        <label htmlFor={id}>Command</label>
        <input
          ref={field}
          id={id}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={COMMAND_LIMIT}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button type="submit">Run command</button>
      </form>
    </div>
  )
}
