import { GraduationCap, Languages } from 'lucide-react'
import { education, profile } from '../data/portfolio'

export function EducationRecords() {
  return (
    <div className="archive-education">
      <div className="archive-education-list">
        {education.map((item) => (
          <article key={item.title}>
            <GraduationCap size={26} aria-hidden="true" />
            <div>
              <h3>{item.title}</h3>
              <p>{item.institution}</p>
            </div>
            <span className="archive-education-date">{item.dates}</span>
          </article>
        ))}
      </div>
      <section
        className="archive-languages"
        aria-labelledby="archive-languages-title"
      >
        <h3 id="archive-languages-title">
          <Languages size={18} aria-hidden="true" />
          Languages
        </h3>
        <p>{profile.languages}</p>
      </section>
    </div>
  )
}
