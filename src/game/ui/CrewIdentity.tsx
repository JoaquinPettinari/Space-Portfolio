import { education, profile } from '../../data/portfolio'
import './CrewIdentity.css'

/** Compact, single-screen factual record. Full records stay in the Archive. */
export function CrewIdentity({ verified }: { verified: boolean }) {
  const master = education.find((item) => item.title.includes('Master'))
  return (
    <div className="crew-identity">
      <p role="status">
        {verified ? 'ACCESS GRANTED · Identity verified' : 'Reading crew card…'}
      </p>
      {verified ? (
        <>
          <h2>{profile.name}</h2>
          <p>
            {profile.role} · {profile.location}
          </p>
          <p>{profile.intro}</p>
          {master && (
            <section>
              <h3>{master.title}</h3>
              <p>{master.institution}</p>
            </section>
          )}
          <p>Complete service record, projects and CV: Central Archive.</p>
        </>
      ) : (
        <p>One scan. No card pickup required. You can leave at any time.</p>
      )}
    </div>
  )
}
