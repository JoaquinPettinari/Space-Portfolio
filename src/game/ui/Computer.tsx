import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { education, experience, profile, projects } from '../../data/portfolio'
import { projectImages } from '../../data/projectImages'
import type { MissionId } from '../missions'

type Section = 'Home' | 'Projects' | 'Experience' | 'Education' | 'Contact'
const sections: Section[] = [
  'Home',
  'Projects',
  'Experience',
  'Education',
  'Contact',
]

const applications: Record<Section, string> = {
  Home: 'Recovery console',
  Projects: 'Mission archives',
  Experience: 'Systems diagnostics',
  Education: 'Crew manifest',
  Contact: 'Earth uplink',
}

export function Computer({
  onClose,
  onMissionComplete,
}: {
  onClose: () => void
  onMissionComplete?: (id: MissionId) => void
}) {
  const close = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [section, setSection] = useState<Section>('Home')
  const [projectId, setProjectId] = useState<string | null>(null)
  const project = projects.find((item) => item.id === projectId)
  const openSection = (next: Section) => {
    setSection(next)
    setProjectId(null)
    if (next === 'Experience') onMissionComplete?.('diagnostics')
  }
  useEffect(() => {
    close.current?.focus()
  }, [])
  useEffect(() => {
    if (section !== 'Home') heading.current?.focus()
  }, [section, projectId])
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const items = dialog.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href]',
    )
    if (!items?.length) return
    const first = items[0],
      last = items[items.length - 1]
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === heading.current)
    ) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <section
      ref={dialog}
      className="computer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="computer-title"
      onKeyDown={trapFocus}
    >
      <div className="monitor-bezel">
        <div className="desktop">
          <header className="desktop-bar">
            <span>ORBIT / JOAQUÍN PETTINARI</span>
            <span>
              RECOVERY TERMINAL <i />
            </span>
          </header>
          <nav className="desktop-nav" aria-label="Computer applications">
            {sections.map((item) => (
              <button
                key={item}
                aria-pressed={section === item}
                title={applications[item]}
                onClick={() => openSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="desktop-content portfolio-content">
            <p className="eyebrow">ORBIT / {applications[section]}</p>
            <h1 id="computer-title" ref={heading} tabIndex={-1}>
              {project?.title ??
                (section === 'Home' ? 'Restore the connection' : section)}
            </h1>
            {section === 'Home' && (
              <>
                <p className="desktop-description">
                  A particle storm interrupted ORBIT’s link with Earth. Life
                  support is stable. Review the crew manifest, inspect the
                  system records and recover the mission archives before
                  preparing a transmission to Mission Control.
                </p>
                <p className="project-scope">
                  Complete objectives in any order. All files remain available;
                  no mission is required to access the portfolio.
                </p>
                <h2>{profile.name} · Crew engineer</h2>
                <p className="desktop-description">{profile.intro}</p>
                <div className="desktop-apps">
                  {(['Projects', 'Experience', 'Contact'] as Section[]).map(
                    (name, index) => (
                      <button
                        className="desktop-app"
                        key={name}
                        onClick={() => openSection(name)}
                      >
                        <span>0{index + 1}</span>
                        <strong>{name}</strong>
                        <small>{applications[name]} →</small>
                      </button>
                    ),
                  )}
                </div>
                <h2>Technologies</h2>
                <div className="skill-tags">
                  {profile.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </>
            )}
            {section === 'Experience' && (
              <>
                <p className="desktop-description">
                  Systems record: review the engineer’s previous assignments and
                  the technologies that keep this mission running.
                </p>
                <div className="portfolio-list">
                  {experience.map((job) => (
                    <article key={job.company}>
                      <p className="eyebrow">
                        {job.dates} · {job.location}
                      </p>
                      <h2>{job.company}</h2>
                      <h3>{job.role}</h3>
                      <p>{job.description}</p>
                    </article>
                  ))}
                </div>
                <a
                  className="portfolio-link"
                  href="/documents/joaquin-pettinari-cv.pdf"
                  download
                  onClick={() => onMissionComplete?.('dossier')}
                >
                  Download CV (PDF)
                </a>
              </>
            )}
            {section === 'Education' && (
              <>
                <p className="desktop-description">
                  Crew identity verified: {profile.name}, {profile.role}.
                  Training and language records are available below.
                </p>
                <div className="portfolio-list">
                  {education.map((item) => (
                    <article key={item.title}>
                      <p className="eyebrow">{item.dates}</p>
                      <h2>{item.title}</h2>
                      <p>{item.institution}</p>
                    </article>
                  ))}
                </div>
                <h2>Languages</h2>
                <p>{profile.languages}</p>
              </>
            )}
            {section === 'Projects' && !project && (
              <div className="project-list">
                {projects.map((item) => (
                  <button
                    className="project-card"
                    key={item.id}
                    onClick={() => {
                      setProjectId(item.id)
                      onMissionComplete?.('archives')
                    }}
                  >
                    <img
                      className="project-thumbnail"
                      src={projectImages[item.id][0].src}
                      alt=""
                      width={projectImages[item.id][0].width}
                      height={projectImages[item.id][0].height}
                      loading="lazy"
                    />
                    <small>{item.category}</small>
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                    <span className="project-open">
                      Recover archive · View project →
                    </span>
                  </button>
                ))}
              </div>
            )}
            {section === 'Projects' && project && (
              <article className="project-detail">
                <p className="eyebrow">{project.category}</p>
                <p>{project.summary}</p>
                <div className="project-gallery">
                  {projectImages[project.id].map((image) => (
                    <figure key={image.src}>
                      <img
                        src={image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        loading="lazy"
                      />
                      <figcaption>{image.caption}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="skill-tags">
                  {project.stack.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <h2>The problem</h2>
                <p>{project.problem}</p>
                <h2>My contribution</h2>
                <p>{project.contribution}</p>
                <h2>Results and scope</h2>
                <p>{project.result}</p>
                <p className="project-scope">{project.scope}</p>
                <div className="project-links">
                  {project.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
                <button
                  className="back-button"
                  onClick={() => setProjectId(null)}
                >
                  Back to projects
                </button>
              </article>
            )}
            {section === 'Contact' && (
              <>
                <p className="desktop-description">
                  Prepare a transmission to Mission Control. The email link
                  opens your email app; you review and send the message there.
                  ORBIT cannot confirm delivery.
                </p>
                <div className="contact-links">
                  <a
                    href={`mailto:${profile.email}`}
                    onClick={() => onMissionComplete?.('uplink')}
                  >
                    Prepare transmission · {profile.email}
                  </a>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn ↗
                  </a>
                  <a href={profile.github} target="_blank" rel="noreferrer">
                    GitHub ↗
                  </a>
                  <a
                    href="/documents/joaquin-pettinari-cv.pdf"
                    download
                    onClick={() => onMissionComplete?.('dossier')}
                  >
                    Download CV (PDF)
                  </a>
                </div>
                <p>{profile.location}</p>
              </>
            )}
          </div>
          <footer className="desktop-footer">
            <span>RECOVERY OPERATIONS · LIFE SUPPORT STABLE</span>
            <button ref={close} data-capture-pointer onClick={onClose}>
              Exit computer
            </button>
          </footer>
        </div>
        <div className="monitor-brand">
          O R B I T <span>●</span>
        </div>
      </div>
      <p className="computer-help">
        ESC to leave · The exit button returns control to the character.
      </p>
    </section>
  )
}
