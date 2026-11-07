import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ContactForm } from './ContactForm'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function fill() {
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Ada Visitor' },
  })
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'ada@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: 'Hello, I would like to discuss your projects.' },
  })
}
function submit() {
  fireEvent.submit(screen.getByRole('form', { name: 'Earth Communications' }))
}

it('skips without submitting a real message and keeps contact available', () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const complete = vi.fn()
  render(<ContactForm onComplete={complete} />)
  expect(
    screen.getByText(/Spanish, English, Italian and Norwegian/),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
  expect(fetch).not.toHaveBeenCalled()
  expect(complete).toHaveBeenCalledExactlyOnceWith('skipped')
  expect(screen.getByRole('status')).toHaveTextContent('No message was sent')
  expect(screen.getByRole('status')).toHaveFocus()
  expect(
    screen.getByRole('button', { name: 'Send Transmission' }),
  ).toBeEnabled()
})

it('requires explicit provider acceptance and prevents duplicate pending sends', async () => {
  let resolve!: (response: Response) => void
  const fetch = vi.fn(
    () =>
      new Promise<Response>((done) => {
        resolve = done
      }),
  )
  vi.stubGlobal('fetch', fetch)
  const complete = vi.fn()
  render(<ContactForm onComplete={complete} />)
  fill()
  submit()
  submit()
  expect(fetch).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveFocus()
  expect(complete).not.toHaveBeenCalled()
  const [url, options] = fetch.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe('/api/contact')
  expect(options.method).toBe('POST')
  expect(JSON.parse(String(options.body))).toMatchObject({
    name: 'Ada Visitor',
    email: 'ada@example.com',
  })
  await act(async () =>
    resolve(new Response(JSON.stringify({ accepted: true }), { status: 200 })),
  )
  expect(complete).toHaveBeenCalledExactlyOnceWith('accepted')
  expect(screen.getByRole('status')).toHaveTextContent(
    'accepted by the email provider',
  )
  expect(
    screen.getByRole('button', { name: 'Send Transmission' }),
  ).toBeDisabled()
})

it.each([
  [503, { error: 'Unavailable' }],
  [200, { accepted: false }],
  [400, { accepted: true }],
])(
  'does not report success for HTTP %s without a valid acceptance response',
  async (status, body) => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status }))
    vi.stubGlobal('fetch', fetch)
    const complete = vi.fn()
    render(<ContactForm onComplete={complete} />)
    fill()
    submit()
    await screen.findByRole('alert')
    expect(complete).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
    expect(
      screen.getByRole('button', { name: 'Send Transmission' }),
    ).toBeEnabled()
    fetch.mockResolvedValue(new Response(JSON.stringify({ accepted: true })))
    submit()
    await waitFor(() =>
      expect(complete).toHaveBeenCalledExactlyOnceWith('accepted'),
    )
  },
)

it('rejects invalid fields before contacting the API', () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  render(<ContactForm />)
  fill()
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'invalid-email' },
  })
  submit()
  expect(screen.getByRole('alert')).toBeVisible()
  expect(fetch).not.toHaveBeenCalled()
})

it('leaves Escape available to its host while a field is focused', () => {
  const key = vi.fn()
  render(
    <div onKeyDown={key}>
      <ContactForm />
    </div>,
  )
  const message = screen.getByLabelText('Message')
  message.focus()
  fireEvent.keyDown(message, { key: 'Escape', code: 'Escape' })
  expect(key).toHaveBeenCalledOnce()
  expect(key.mock.calls[0][0].defaultPrevented).toBe(false)
  expect(
    screen.getByRole('link', { name: 'joaquinpettinari@hotmail.com' }),
  ).toHaveAttribute('href', 'mailto:joaquinpettinari@hotmail.com')
})

it('aborts a pending request on unmount and never completes it afterward', async () => {
  let resolve!: (response: Response) => void
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done
      }),
  )
  vi.stubGlobal('fetch', fetch)
  const complete = vi.fn()
  const { unmount } = render(<ContactForm onComplete={complete} />)
  fill()
  submit()
  const signal = fetch.mock.calls[0][1]?.signal
  unmount()
  expect(signal?.aborted).toBe(true)
  await act(async () =>
    resolve(new Response(JSON.stringify({ accepted: true }))),
  )
  expect(complete).not.toHaveBeenCalled()
})

it('bounds waiting time and retains a safe retry path after a network timeout', async () => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    ),
  )
  const complete = vi.fn()
  render(<ContactForm onComplete={complete} />)
  fill()
  submit()
  await act(async () => vi.advanceTimersByTimeAsync(15_000))
  expect(screen.getByRole('alert')).toHaveTextContent('not confirmed')
  expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()
  expect(complete).not.toHaveBeenCalled()
})
