import { useEffect, useId, useRef, useState } from 'react'
import { education, experience, profile, projects } from '../data/portfolio'
import { projectImages } from '../data/projectImages'

type Section =
  'Profile' | 'Projects' | 'Service Record' | 'Training' | 'Contact'
const sections: Section[] = [
  'Profile',
  'Projects',
  'Service Record',
  'Training',
  'Contact',
]
export type PortfolioActivity = 'archives' | 'dossier'

/** Shared DOM-only content: usable without the station, WebGL or mission progress. */
export function PortfolioContent({
  onActivity,
  headingId,
}: {
  onActivity?: (id: PortfolioActivity) => void
  headingId?: string
}) {
  const generatedId = useId()
  const titleId = headingId ?? generatedId
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const [section, setSection] = useState<Section>('Profile')
  const [projectId, setProjectId] = useState<string | null>(null)
  const project = projects.find((item) => item.id === projectId)
  const openSection = (next: Section) => {
    setSection(next)
    setProjectId(null)
    if (next === 'Service Record') onActivity?.('archives')
  }
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [section, projectId])
  return (
    <div className="portfolio-browser">
      <nav className="desktop-nav" aria-label="Portfolio sections">
        {sections.map((item) => (
          <button
            key={item}
            aria-pressed={section === item}
            onClick={() => openSection(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <section
        className="desktop-content portfolio-content"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} ref={heading} tabIndex={-1}>
          {project?.title ?? (section === 'Profile' ? profile.name : section)}
        </h2>
        {section === 'Profile' && (
          <>
            <p className="eyebrow">
              {profile.role} · {profile.location}
            </p>
            <p className="desktop-description">{profile.intro}</p>
            <p className="project-scope">
              All professional records are available immediately. No mission or
              game interaction is required.
            </p>
            <a
              className="portfolio-link"
              href="/documents/joaquin-pettinari-cv.pdf"
              download
              onClick={() => onActivity?.('dossier')}
            >
              Download CV (PDF)
            </a>
            <h3>Technologies</h3>
            <div className="skill-tags">
              {profile.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <h3>Languages</h3>
            <p>{profile.languages}</p>
          </>
        )}
        {section === 'Service Record' && (
          <>
            <p className="desktop-description">
              Employment history and professional responsibilities, preserved
              from the supplied CV.
            </p>
            <div className="portfolio-list">
              {experience.map((job) => (
                <article key={job.company}>
                  <p className="eyebrow">
                    {job.dates} · {job.location}
                  </p>
                  <h3>{job.company}</h3>
                  <h4>{job.role}</h4>
                  <p>{job.description}</p>
                </article>
              ))}
            </div>
            <a
              className="portfolio-link"
              href="/documents/joaquin-pettinari-cv.pdf"
              download
              onClick={() => onActivity?.('dossier')}
            >
              Download CV (PDF)
            </a>
          </>
        )}
        {section === 'Training' && (
          <>
            <p className="desktop-description">
              Degrees, certification and language records from the supplied
              professional profile.
            </p>
            <div className="portfolio-list">
              {education.map((item) => (
                <article key={item.title}>
                  <p className="eyebrow">{item.dates}</p>
                  <h3>{item.title}</h3>
                  <p>{item.institution}</p>
                </article>
              ))}
            </div>
            <h3>Languages</h3>
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
                  onActivity?.('archives')
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
                <span className="project-open">View project →</span>
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
            <h3>The problem</h3>
            <p>{project.problem}</p>
            <h3>My contribution</h3>
            <p>{project.contribution}</p>
            <h3>Results and scope</h3>
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
            <button className="back-button" onClick={() => setProjectId(null)}>
              Back to projects
            </button>
          </article>
        )}
        {section === 'Contact' && (
          <>
            <p className="desktop-description">
              Contact Joaquín directly. The email link opens your email app; you
              review and send the message there. This portfolio cannot confirm
              delivery.
            </p>
            <div className="contact-links">
              <a href={`mailto:${profile.email}`}>
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
                onClick={() => onActivity?.('dossier')}
              >
                Download CV (PDF)
              </a>
            </div>
            <p>{profile.location}</p>
          </>
        )}
      </section>
    </div>
  )
}
