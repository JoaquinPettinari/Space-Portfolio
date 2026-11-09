import { useState } from 'react'
import { BriefcaseBusiness, MapPin, Download } from 'lucide-react'
import { experience } from '../data/portfolio'

export function ServiceRecord({ onDownload }: { onDownload: () => void }) {
  const [selected, setSelected] = useState(0)
  const job = experience[selected]
  return (
    <div className="archive-service">
      <div
        className="archive-service-index"
        role="group"
        aria-label="Employment records"
      >
        {experience.map((item, index) => (
          <button
            key={item.company}
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
          >
            <small>{item.dates}</small>
            <strong>{item.company}</strong>
          </button>
        ))}
      </div>
      <div className="archive-service-sheet">
        <article aria-live="polite" aria-atomic="true">
          <p className="archive-service-number">
            <BriefcaseBusiness size={18} aria-hidden="true" /> Employment record
            · {String(selected + 1).padStart(2, '0')} /{' '}
            {String(experience.length).padStart(2, '0')}
          </p>
          <h3>{job.company}</h3>
          <h4>{job.role}</h4>
          <p className="archive-service-meta">{job.dates}</p>
          <p className="archive-service-meta">
            <MapPin size={14} aria-hidden="true" />
            {job.location}
          </p>
          <h5>Responsibilities & contributions</h5>
          <p className="archive-service-description">{job.description}</p>
        </article>
        <a
          className="archive-service-download"
          href="/documents/joaquin-pettinari-cv.pdf"
          download
          onClick={onDownload}
        >
          <Download size={16} aria-hidden="true" />
          Download CV (PDF)
        </a>
      </div>
    </div>
  )
}
