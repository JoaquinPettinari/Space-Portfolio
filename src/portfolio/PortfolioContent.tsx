import { useEffect, useId, useRef, useState } from 'react'
import { education, experience, profile, projects } from '../data/portfolio'
import { projectImages } from '../data/projectImages'
import {
  House,
  Layers,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
} from 'lucide-react'
import { EducationRecords } from './EducationRecords'
import { ServiceRecord } from './ServiceRecord'
import { ProjectDetail } from './ProjectDetail'
import { ArchiveOverview } from './ArchiveOverview'
import { ContactForm } from '../contact/ContactForm'

type Section =
  'Profile' | 'Projects' | 'Service Record' | 'Training' | 'Contact'
const sections: Section[] = [
  'Profile',
  'Projects',
  'Service Record',
  'Training',
  'Contact',
]
const sectionIcons = {
  Profile: House,
  Projects: Layers,
  'Service Record': BriefcaseBusiness,
  Training: GraduationCap,
  Contact: Mail,
}
const screenLabels: Record<Section, string> = {
  Profile: 'Overview',
  Projects: 'Projects',
  'Service Record': 'Service Record',
  Training: 'Education',
  Contact: 'Contact',
}
export type PortfolioActivity = 'archives' | 'dossier'

/** Shared DOM-only content: usable without the station, WebGL or mission progress. */
export function PortfolioContent({
  onActivity,
  headingId,
  physical = false,
}: {
  onActivity?: (id: PortfolioActivity) => void
  physical?: boolean
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
    if (mounted.current && heading.current) {
      heading.current.focus({ preventScroll: true })
      // Scroll the content pane, never the CSS-transformed monitor/canvas parent.
      if (heading.current.parentElement)
        heading.current.parentElement.scrollTop = 0
    }
    mounted.current = true
  }, [section, projectId])
  return (
    <div className="portfolio-browser">
      <nav className="desktop-nav" aria-label="Portfolio sections">
        {sections
          .filter((item) => !physical || item !== 'Contact')
          .map((item) => {
            const Icon = sectionIcons[item]
            return (
              <button
                key={item}
                aria-pressed={section === item}
                onClick={() => openSection(item)}
              >
                {physical && <Icon size={21} aria-hidden="true" />}
                {physical ? screenLabels[item] : item}
              </button>
            )
          })}
        {physical && (
          <span className="archive-online">
            <i />
            Archive online
          </span>
        )}
      </nav>
      <section
        className={`desktop-content portfolio-content${physical && section === 'Profile' ? ' archive-overview-pane' : ''}${physical && project ? ' archive-detail-pane' : ''}`}
        aria-labelledby={titleId}
      >
        <h2
          id={titleId}
          ref={heading}
          tabIndex={-1}
          className={
            physical && section === 'Profile' ? 'archive-sr-only' : undefined
          }
        >
          {project?.title ??
            (section === 'Profile'
              ? profile.name
              : physical
                ? screenLabels[section]
                : section)}
        </h2>
        {section === 'Profile' && physical && (
          <ArchiveOverview
            onDownload={() => onActivity?.('dossier')}
            onProject={(id) => {
              setSection('Projects')
              setProjectId(id)
              onActivity?.('archives')
            }}
          />
        )}
        {section === 'Profile' && !physical && (
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
        {section === 'Service Record' && physical && (
          <ServiceRecord onDownload={() => onActivity?.('dossier')} />
        )}
        {section === 'Service Record' && !physical && (
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
        {section === 'Training' && physical && <EducationRecords />}
        {section === 'Training' && !physical && (
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
          <div
            className={`project-list${physical ? ' archive-project-list' : ''}`}
          >
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
                {physical && (
                  <div className="archive-project-stack">
                    {item.stack.slice(0, 4).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
                <span className="project-open">
                  {physical ? 'Open record →' : 'View project →'}
                </span>
              </button>
            ))}
          </div>
        )}
        {section === 'Projects' && project && (
          <ProjectDetail
            key={project.id}
            project={project}
            onBack={() => setProjectId(null)}
            onProject={(id) => {
              setProjectId(id)
              onActivity?.('archives')
            }}
          />
        )}
        {section === 'Contact' && (
          <>
            <ContactForm />
            <div className="contact-links">
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
