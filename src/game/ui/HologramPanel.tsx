import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { education, profile } from '../../data/portfolio'
import './HologramPanel.css'

export function HologramPanel({
  onClose,
  assistant,
}: {
  onClose: () => void
  assistant?: ReactNode
}) {
  const [section, setSection] = useState<'profile' | 'training'>('profile')
  const panel = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const master = education.find((item) => item.title.includes('Master'))
  useEffect(() => {
    close.current?.focus()
  }, [])
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button')
    if (!buttons?.length) return
    const first = buttons[0],
      last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <section
      ref={panel}
      className="hologram-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hologram-title"
      onKeyDown={trapFocus}
    >
      <p className="eyebrow">CRUZ DEL SUR / IDENTITY VERIFIED</p>
      <h1 id="hologram-title">{profile.name}</h1>
      <p className="hologram-rank">CREW ENGINEER · {profile.role}</p>
      {assistant}
      <nav aria-label="Crew record sections">
        <button
          aria-pressed={section === 'profile'}
          onClick={() => setSection('profile')}
        >
          Crew profile
        </button>
        <button
          aria-pressed={section === 'training'}
          onClick={() => setSection('training')}
        >
          Training record
        </button>
      </nav>
      <div className="hologram-record">
        {section === 'profile' ? (
          <>
            <p>{profile.intro}</p>
            <p>{profile.location}</p>
            {master && (
              <article>
                <h2>{master.title}</h2>
                <p>{master.institution}</p>
              </article>
            )}
            <p>
              Your complete service record and project archives are available at
              the main computer.
            </p>
          </>
        ) : (
          <>
            {education.map((item) => (
              <article key={item.title}>
                <small>{item.dates}</small>
                <h2>{item.title}</h2>
                <p>{item.institution}</p>
              </article>
            ))}
            <h2>Languages</h2>
            <p>{profile.languages}</p>
          </>
        )}
      </div>
      <footer>
        <span>E to resume · ESC to pause</span>
        <button ref={close} data-capture-pointer onClick={onClose}>
          Leave hologram
        </button>
      </footer>
    </section>
  )
}
