import { BadgeCheck, CreditCard, LoaderCircle } from 'lucide-react'
import { education, profile } from '../../data/portfolio'
import './CrewIdentity.css'

/** Factual identity; the existing reader owns verification and access. */
export function CrewIdentity({
  verified,
  scanning = false,
}: {
  verified: boolean
  scanning?: boolean
}) {
  const master = education.find((item) => item.title.includes('Master'))
  return (
    <div className="crew-identity">
      <div className="crew-reader-display" aria-hidden="true">
        <span>IDENTIFICATION</span>
        <div className="crew-card-symbol">
          <CreditCard size={100} strokeWidth={1} />
        </div>
        <strong>{verified ? 'CARD VERIFIED' : 'SCAN CREW CARD'}</strong>
        <small>CRUZ DEL SUR · CDS-01</small>
      </div>
      <div className="crew-identity-record">
        <div className="crew-record-main">
          {verified ? (
            <>
              <div className="crew-identity-person">
                <img src="/images/crew-portrait.webp" alt={profile.name} />
                <div>
                  <h2>{profile.name}</h2>
                  <p className="crew-role">{profile.role}</p>
                  <dl className="crew-record-facts">
                    <div>
                      <dt>LOCATION</dt>
                      <dd>{profile.location}</dd>
                    </div>
                    <div>
                      <dt>EXPERIENCE</dt>
                      <dd>+6 years</dd>
                    </div>
                  </dl>
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
              {scanning ? (
                <LoaderCircle
                  className="crew-loading-spinner"
                  size={40}
                  aria-hidden="true"
                />
              ) : (
                <CreditCard size={40} aria-hidden="true" />
              )}
              <h2>Crew verification</h2>
              <p>Presenting personnel card to the access reader.</p>
            </div>
          )}
        </div>
        <p
          role="status"
          className={verified ? 'crew-access-granted' : 'crew-access-scanning'}
        >
          {verified ? (
            <BadgeCheck size={32} aria-hidden="true" />
          ) : scanning ? (
            <LoaderCircle
              className="crew-loading-spinner"
              size={25}
              aria-hidden="true"
            />
          ) : (
            <CreditCard size={25} aria-hidden="true" />
          )}
          {verified
            ? 'ACCESS GRANTED · Identity verified'
            : scanning
              ? 'Verifying credentials… Please wait.'
              : 'Presenting crew card…'}
        </p>
        <p
          className="crew-record-hint"
          aria-hidden={!verified}
          style={{ visibility: verified ? 'visible' : 'hidden' }}
        >
          Welcome aboard. Complete service record, projects and CV: Central
          Archive.
        </p>
      </div>
    </div>
  )
}
