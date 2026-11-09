import { useState } from 'react'
import { projects } from '../data/portfolio'
import { projectImages } from '../data/projectImages'
import './ProjectDetail.css'

export function ProjectDetail({
  project,
  onBack,
  onProject,
}: {
  project: (typeof projects)[number]
  onBack: () => void
  onProject: (id: string) => void
}) {
  const [imageIndex, setImageIndex] = useState(0)
  const images = projectImages[project.id]
  const image = images[imageIndex]
  const index = projects.findIndex((item) => item.id === project.id)
  return (
    <article className="project-detail archive-record">
      <div className="archive-record-toolbar" aria-label="Project navigation">
        <button onClick={onBack}>Back to projects</button>
        <span>
          {index + 1} / {projects.length}
        </span>
        <button
          disabled={index === 0}
          onClick={() => onProject(projects[index - 1].id)}
        >
          Previous project
        </button>
        <button
          disabled={index === projects.length - 1}
          onClick={() => onProject(projects[index + 1].id)}
        >
          Next project
        </button>
      </div>
      <div className="archive-record-body">
        <div className="archive-record-media">
          <figure>
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
            />
            <figcaption>{image.caption}</figcaption>
          </figure>
          <div className="archive-image-controls" aria-label="Project images">
            {images.map((item, i) => (
              <button
                key={item.src}
                aria-label={`Image ${i + 1}: ${item.caption}`}
                aria-pressed={i === imageIndex}
                onClick={() => setImageIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="archive-project-stack">
            {project.stack.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
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
        </div>
        <div
          className="archive-record-copy"
          tabIndex={0}
          role="region"
          aria-label={`${project.title} record details`}
        >
          <p className="eyebrow">{project.category}</p>
          <p>{project.summary}</p>
          <h3>The problem</h3>
          <p>{project.problem}</p>
          <h3>My contribution</h3>
          <p>{project.contribution}</p>
          <h3>Results and scope</h3>
          <p>{project.result}</p>
          <p className="project-scope">{project.scope}</p>
        </div>
      </div>
    </article>
  )
}
