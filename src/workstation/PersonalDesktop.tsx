import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { profile, projects } from '../data/portfolio'
import { projectImages } from '../data/projectImages'
import { CommandTerminal } from './CommandTerminal'
import './PersonalDesktop.css'
import {
  FileUser,
  Images,
  SlidersHorizontal,
  SquareTerminal,
} from 'lucide-react'

const applications = [
  { id: 'dossier', title: 'Crew Dossier.pdf', icon: FileUser },
  { id: 'gallery', title: 'Project Gallery', icon: Images },
  { id: 'settings', title: 'Station Settings', icon: SlidersHorizontal },
  { id: 'command', title: 'Command Terminal', icon: SquareTerminal },
] as const
type Application = (typeof applications)[number]['id']
const gallery = projects.flatMap((project) =>
  (projectImages[project.id] ?? []).map((image) => ({
    ...image,
    project: project.title,
  })),
)

/** Desktop applications remain available independently of protocol progress. */
export function PersonalDesktop({
  onDossier,
  onBrewCoffee,
}: {
  onDossier: () => void
  onBrewCoffee?: () => void
}) {
  const titleId = useId()
  const [application, setApplication] = useState<Application | null>(null)
  const [selected, setSelected] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [skipped, setSkipped] = useState(false)
  const icons = useRef<(HTMLButtonElement | null)[]>([])
  const close = useRef<HTMLButtonElement>(null)
  const active = applications.find((item) => item.id === application)
  const image = gallery[imageIndex]
  useEffect(() => {
    if (application) close.current?.focus()
  }, [application])
  const closeApplication = () => {
    setApplication(null)
    icons.current[selected]?.focus()
  }
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = (selected + 1) % applications.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (selected + applications.length - 1) % applications.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = applications.length - 1
    else return
    event.preventDefault()
    setSelected(next)
    icons.current[next]?.focus()
  }

  return (
    <div
      className={`personal-desktop${active ? ' personal-desktop--active' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && application) {
          event.preventDefault()
          event.stopPropagation()
          closeApplication()
        }
      }}
    >
      <div className="personal-home-profile" hidden={!!active}>
        <p className="eyebrow">CREW DESKTOP · CDS-01</p>
        <img src="/images/crew-portrait.webp" alt={profile.name} />
        <h2>{profile.name}</h2>
        <p>{profile.role}</p>
        <small>{profile.location}</small>
      </div>
      <div
        className="personal-desktop-icons"
        role="toolbar"
        aria-label="Desktop applications"
        onKeyDown={navigate}
      >
        {applications.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              icons.current[index] = element
            }}
            type="button"
            tabIndex={selected === index ? 0 : -1}
            aria-pressed={application === item.id}
            onFocus={() => setSelected(index)}
            onClick={() => {
              setSelected(index)
              setApplication(item.id)
            }}
          >
            <item.icon size={36} aria-hidden="true" />
            {item.title}
          </button>
        ))}
      </div>
      <p className="personal-desktop-help">
        Click once or press Enter to open. Arrow keys select applications.
        Escape closes the current window; Escape again returns to the station.
      </p>
      {active && (
        <section className="personal-desktop-window" aria-labelledby={titleId}>
          <header>
            <h2 id={titleId}>{active.title}</h2>
            <button
              ref={close}
              type="button"
              onClick={closeApplication}
              aria-label={`Close ${active.title}`}
            >
              Close window
            </button>
          </header>
          {application === 'dossier' && (
            <div className="personal-desktop-document">
              <p>
                The original professional CV supplied by {profile.name}. No
                mission is required to access it.
              </p>
              <a
                href="/documents/joaquin-pettinari-cv.pdf"
                download
                onClick={onDossier}
              >
                Download CV (PDF)
              </a>
              <a
                href="/documents/joaquin-pettinari-cv.pdf"
                target="_blank"
                rel="noreferrer"
                onClick={onDossier}
              >
                Open CV in a new tab
              </a>
              <button
                type="button"
                disabled={skipped}
                onClick={() => {
                  setSkipped(true)
                  close.current?.focus({ preventScroll: true })
                  onDossier()
                }}
              >
                Skip dossier objective
              </button>
              {skipped && (
                <p role="status">
                  Dossier objective skipped. The CV remains available above.
                </p>
              )}
            </div>
          )}
          {application === 'gallery' && image && (
            <div className="personal-desktop-gallery">
              <p>
                Project screenshots extracted from the supplied academic
                documents.
              </p>
              <figure>
                <div
                  className="personal-image-inspection"
                  tabIndex={0}
                  role="region"
                  aria-label="Project image inspection. Scroll to inspect enlarged image."
                >
                  <img
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    style={{ width: `${zoom * 100}%` }}
                  />
                </div>
                <figcaption>
                  {image.project} — {image.caption}
                </figcaption>
              </figure>
              <div
                className="personal-desktop-gallery-controls"
                aria-label="Image zoom"
              >
                <button
                  type="button"
                  aria-disabled={zoom === 1}
                  onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
                >
                  Zoom out
                </button>
                <span aria-live="polite">{zoom * 100}%</span>
                <button
                  type="button"
                  aria-disabled={zoom === 3}
                  onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
                >
                  Zoom in
                </button>
                <button type="button" onClick={() => setZoom(1)}>
                  Reset zoom
                </button>
              </div>
              <div className="personal-desktop-gallery-controls">
                <button
                  type="button"
                  disabled={imageIndex === 0}
                  onClick={() => {
                    setImageIndex((index) => index - 1)
                    setZoom(1)
                  }}
                >
                  Previous image
                </button>
                <span role="status">
                  {imageIndex + 1} / {gallery.length}
                </span>
                <button
                  type="button"
                  disabled={imageIndex === gallery.length - 1}
                  onClick={() => {
                    setImageIndex((index) => index + 1)
                    setZoom(1)
                  }}
                >
                  Next image
                </button>
              </div>
            </div>
          )}
          {application === 'command' && (
            <CommandTerminal onBrewCoffee={onBrewCoffee} />
          )}
          {application === 'settings' && (
            <div>
              <h3>Controls</h3>
              <p>
                WASD: move · Mouse: look · Space: jump · E: interact · T:
                mission tablet.
              </p>
              <h3>Comfort and accessibility</h3>
              <p>
                Reduced motion follows your device's accessibility preference.
                Enable reduced motion in your operating system to shorten
                transitions and stop ambient movement.
              </p>
              <p>
                Escape releases the mouse. Quick Portfolio Access is available
                inside the mission tablet (T, then R), with all professional
                information and no gameplay requirements.
              </p>
              <p>
                Sound is optional. Use the station sound control while the
                cursor is free. Mission subtitles remain available without
                sound.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
