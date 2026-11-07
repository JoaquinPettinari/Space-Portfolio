import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CONTACT_LIMITS, validateContact } from '../../shared/contact'
import { profile } from '../data/portfolio'
import './ContactForm.css'

export type ContactOutcome = 'accepted' | 'skipped'

/** Shared by the physical communications terminal and the DOM portfolio. */
export function ContactForm({
  onComplete,
}: {
  onComplete?: (outcome: ContactOutcome) => void
}) {
  const id = useId()
  const request = useRef<AbortController | null>(null)
  const statusMessage = useRef<HTMLParagraphElement>(null)
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'accepted' | 'skipped' | 'error'
  >('idle')
  const [error, setError] = useState('')
  useEffect(
    () => () => {
      request.current?.abort()
      request.current = null
    },
    [],
  )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (request.current || status === 'accepted') return
    const values = new FormData(event.currentTarget)
    const result = validateContact({
      name: values.get('name'),
      email: values.get('email'),
      message: values.get('message'),
      website: values.get('website'),
    })
    if (result.error !== undefined) {
      setError(result.error)
      setStatus('error')
      return
    }
    const controller = new AbortController()
    request.current = controller
    // Move focus before disabling the submitting fieldset so it stays in the terminal.
    statusMessage.current?.focus()
    setStatus('sending')
    setError('')
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result.data, website: '' }),
        signal: controller.signal,
      })
      const body: unknown = await response.json()
      if (request.current !== controller) return
      if (
        response.ok &&
        typeof body === 'object' &&
        body !== null &&
        'accepted' in body &&
        body.accepted === true
      ) {
        setStatus('accepted')
        onComplete?.('accepted')
      } else {
        setError(
          response.status === 429
            ? 'Too many transmission attempts. Please wait before trying again.'
            : 'Transmission was not confirmed. Please try again later or use the email link.',
        )
        setStatus('error')
      }
    } catch {
      if (request.current !== controller) return
      setError(
        'Transmission was not confirmed. Check your connection before trying again.',
      )
      setStatus('error')
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) request.current = null
    }
  }

  return (
    <form
      className="contact-form"
      onSubmit={(event) => void submit(event)}
      aria-label="Earth Communications"
      aria-describedby={`${id}-notice`}
    >
      <p id={`${id}-notice`}>
        This sends a real message to Joaquín Pettinari. Messages welcome in
        Spanish, English, Italian and Norwegian.
      </p>
      <p className="contact-privacy">
        Your name, email and message are used to receive and reply to your
        inquiry through an email provider. Do not include sensitive information.
        Form contents are not saved in this browser.
      </p>
      <p>
        Prefer your email app?{' '}
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <fieldset disabled={status === 'sending' || status === 'accepted'}>
        <legend>Your transmission</legend>
        <label htmlFor={`${id}-name`}>Name</label>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          required
          maxLength={CONTACT_LIMITS.name}
        />
        <label htmlFor={`${id}-email`}>Email</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={CONTACT_LIMITS.email}
        />
        <label htmlFor={`${id}-message`}>Message</label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          minLength={1}
          maxLength={CONTACT_LIMITS.message}
          rows={5}
        />
        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Leave this field empty</label>
          <input
            id={`${id}-website`}
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button type="submit">
          {status === 'sending' ? 'Transmitting…' : 'Send Transmission'}
        </button>
      </fieldset>
      <button
        type="button"
        disabled={
          status === 'sending' || status === 'accepted' || status === 'skipped'
        }
        onClick={() => {
          if (request.current) return
          statusMessage.current?.focus()
          setError('')
          setStatus('skipped')
          onComplete?.('skipped')
        }}
      >
        Skip
      </button>
      {status === 'error' && <p role="alert">{error}</p>}
      <p ref={statusMessage} tabIndex={-1} role="status" aria-live="polite">
        {status === 'sending' &&
          'Waiting for confirmation. Please keep this terminal open.'}
        {status === 'accepted' &&
          'Transmission accepted by the email provider. Thank you! Inbox delivery is not guaranteed.'}
        {status === 'skipped' &&
          'Fictional status report recorded. No message was sent by Skip. You can still contact Joaquín whenever you wish.'}
      </p>
    </form>
  )
}
