import { ArrowUpRight, Download, MapPin } from 'lucide-react'
import { profile, projects } from '../data/portfolio'
import { projectImages } from '../data/projectImages'

export function ArchiveOverview({
  onDownload,
  onProject,
}: {
  onDownload: () => void
  onProject: (id: string) => void
}) {
  return (
    <div className="archive-overview">
      <div className="archive-profile">
        <img
          className="archive-portrait"
          src="/images/crew-portrait.webp"
          alt="Joaquín Pettinari"
        />
        <div className="archive-profile-copy">
          <p className="archive-name" aria-hidden="true">
            {profile.name}
          </p>
          <p className="archive-role">{profile.role}</p>
          <p className="archive-location">
            <MapPin size={13} aria-hidden="true" />
            {profile.location}
          </p>
          <p className="archive-summary">{profile.intro}</p>
          <div className="archive-technologies">
            {profile.skills.slice(0, 4).map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
          <a
            className="archive-download"
            href="/documents/joaquin-pettinari-cv.pdf"
            download
            onClick={onDownload}
          >
            <Download size={15} aria-hidden="true" />
            Download CV (PDF)
          </a>
        </div>
      </div>
      <h3>Featured projects</h3>
      <div className="archive-featured">
        {projects.map((project) => (
          <button key={project.id} onClick={() => onProject(project.id)}>
            <img src={projectImages[project.id][0].src} alt="" />
            <span className="archive-project-caption">
              <strong>{project.title}</strong>
              <small>{project.category}</small>
            </span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
