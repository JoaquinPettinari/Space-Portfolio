import { BadgeCheck, CreditCard, ScanLine } from 'lucide-react'
import { education, profile } from '../../data/portfolio'
import './CrewIdentity.css'

/** Compact factual identity; verification is owned by the existing reader. */
export function CrewIdentity({ verified }: { verified: boolean }) {
  const master = education.find((item) => item.title.includes('Master'))
  return (
    <div className="crew-identity">
      <div className="crew-reader-display" aria-hidden="true">
        <span>IDENTIFICATION</span>
        <div className="crew-card-symbol">
          <CreditCard size={90} strokeWidth={1} />
        </div>
        <strong>{verified ? 'CARD VERIFIED' : 'SCANNING CARD'}</strong>
        <small>CRUZ DEL SUR · CDS-01</small>
      </div>
      <div className="crew-identity-record">
        {verified ? (
          <>
            <div className="crew-identity-person">
              <img src="/images/crew-portrait.webp" alt={profile.name} />
              <div>
                <h2>{profile.name}</h2>
                <p className="crew-role">{profile.role}</p>
                <p>{profile.location}</p>
              </div>
            </div>
            {master && (
              <section className="crew-degree">
                <h3>{master.title}</h3>
                <p>{master.institution}</p>
              </section>
            )}
          </>
        ) : (
          <div className="crew-scan-copy">
            <ScanLine size={40} aria-hidden="true" />
            <h2>Crew verification</h2>
            <p>One scan. No card pickup required. You can leave at any time.</p>
          </div>
        )}
        <p
          role="status"
          className={verified ? 'crew-access-granted' : 'crew-access-scanning'}
        >
          {verified ? (
            <BadgeCheck size={25} aria-hidden="true" />
          ) : (
            <ScanLine size={25} aria-hidden="true" />
          )}
          {verified
            ? 'ACCESS GRANTED · Identity verified'
            : 'Reading crew card…'}
        </p>
        {verified && (
          <p className="crew-record-hint">
            Welcome aboard. Complete service record, projects and CV: Central
            Archive.
          </p>
        )}
      </div>
    </div>
  )
}
