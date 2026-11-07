// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { handleContact } from './contact.ts'
import { validateContact } from '../shared/contact.ts'

const env = {
  CONTACT_ORIGIN: 'https://portfolio.example',
  CONTACT_FROM: 'station@example.com',
  CONTACT_TO: 'owner@example.com',
  RESEND_API_KEY: 'test-only',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-only',
  CONTACT_RATE_SECRET: 'test-only-secret-with-at-least-32-characters',
}
const message = {
  name: 'Joaquín Østergård',
  email: 'visitor@example.com',
  message: 'Hola! Hei! Ciao! Hello!',
}
function request(
  body: unknown = message,
  headers: Record<string, string> = {},
) {
  return new Request('https://portfolio.example/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: env.CONTACT_ORIGIN,
      'x-vercel-forwarded-for': '192.0.2.1',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}
function transport(
  rate = 0,
  provider: unknown = { id: 'accepted-id' },
  status = 200,
) {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ result: rate }))
    .mockResolvedValueOnce(Response.json(provider, { status }))
}

describe('contact validation', () => {
  it('accepts Unicode names and multilingual messages; trims fields', () => {
    expect(
      validateContact({ ...message, name: ` ${message.name} `, website: '' }),
    ).toEqual({ data: message })
  })
  it.each([
    null,
    [],
    {},
    { ...message, name: 23 },
    { ...message, name: ' ' },
    { ...message, name: 'n'.repeat(101) },
    { ...message, email: 'a@b' },
    { ...message, email: 'a@example.com\r\nBcc:evil@example.com' },
    { ...message, name: 'a\nBcc: evil' },
    { ...message, message: '\u0000' },
    { ...message, message: 'm'.repeat(5001) },
    { ...message, to: 'attacker@example.com' },
    { ...message, website: 'spam.example' },
  ])('rejects malformed/oversized/unexpected data: %j', (value) => {
    expect(validateContact(value).error).toBeTruthy()
  })
})

describe('contact endpoint (all outbound requests mocked)', () => {
  it('returns acceptance only after provider confirmation and fixes recipient/header fields', async () => {
    const fetcher = transport()
    const response = await handleContact(request(), env, fetcher)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ accepted: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
    const [url, options] = fetcher.mock.calls[1]
    expect(url).toBe('https://api.resend.com/emails')
    expect(JSON.parse(String(options?.body))).toEqual({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: message.email,
      subject: 'CRUZ DEL SUR — Portfolio transmission',
      text: `From: ${message.name}\nReply to: ${message.email}\n\n${message.message}`,
    })
    const redisPayload = String(fetcher.mock.calls[0][1]?.body)
    expect(redisPayload).toContain('EVAL')
    expect(redisPayload).not.toContain('192.0.2.1')
    expect(redisPayload).not.toContain(message.email)
  })
  it('uses stable provider idempotency keys for retries', async () => {
    const first = transport()
    const second = transport()
    await handleContact(request(), env, first)
    await handleContact(request(), env, second)
    expect(first.mock.calls[1][1]?.headers).toEqual(
      second.mock.calls[1][1]?.headers,
    )
  })
  it('rejects methods and unsupported content types without network', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const get = await handleContact(
      new Request('https://portfolio.example/api/contact'),
      env,
      fetcher,
    )
    expect(get.status).toBe(405)
    expect(get.headers.get('allow')).toBe('POST')
    expect(
      (
        await handleContact(
          request(message, { 'Content-Type': 'text/plain' }),
          env,
          fetcher,
        )
      ).status,
    ).toBe(415)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('fails closed without credentials, origin or trusted IP; never exposes secrets', async () => {
    const fetcher = vi.fn<typeof fetch>()
    for (const config of [
      {},
      { ...env, CONTACT_RATE_SECRET: '' },
      { ...env, UPSTASH_REDIS_REST_URL: 'http://localhost' },
    ]) {
      const response = await handleContact(request(), config, fetcher)
      expect(response.status).toBe(503)
      expect(await response.text()).not.toContain('test-only')
    }
    expect(
      (
        await handleContact(
          request(message, { Origin: 'https://attacker.example' }),
          env,
          fetcher,
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await handleContact(
          request(message, { 'x-vercel-forwarded-for': '' }),
          env,
          fetcher,
        )
      ).status,
    ).toBe(503)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects invalid and honeypot payloads without sending', async () => {
    const fetcher = vi.fn<typeof fetch>()
    for (const body of [
      {},
      { ...message, website: 'bot' },
      { ...message, to: 'evil@example.com' },
    ]) {
      expect((await handleContact(request(body), env, fetcher)).status).toBe(
        400,
      )
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('limits actual streamed bytes as well as declared length', async () => {
    const fetcher = vi.fn<typeof fetch>()
    expect(
      (
        await handleContact(
          request(message, { 'Content-Length': '24001' }),
          env,
          fetcher,
        )
      ).status,
    ).toBe(413)
    expect(
      (
        await handleContact(
          request({ ...message, message: 'x'.repeat(24000) }),
          env,
          fetcher,
        )
      ).status,
    ).toBe(413)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('handles malformed JSON', async () => {
    const original = request()
    const malformed = new Request(original.url, {
      method: 'POST',
      headers: original.headers,
      body: '{',
    })
    const fetcher = vi.fn<typeof fetch>()
    expect((await handleContact(malformed, env, fetcher)).status).toBe(400)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('limits abuse without invoking email provider', async () => {
    const fetcher = transport(600)
    const response = await handleContact(request(), env, fetcher)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('600')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each([{ error: 'redis error' }, { result: '0' }, { result: -1 }])(
    'fails closed on invalid rate responses %j',
    async (payload) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(payload))
      expect((await handleContact(request(), env, fetcher)).status).toBe(503)
      expect(fetcher).toHaveBeenCalledTimes(1)
    },
  )
  it('fails closed on rate service outages/timeouts', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException('timeout', 'TimeoutError'))
    expect((await handleContact(request(), env, fetcher)).status).toBe(503)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each([{ error: 'secret provider diagnostic' }, {}, { id: '' }])(
    'does not accept false provider success %j',
    async (payload) => {
      const response = await handleContact(
        request(),
        env,
        transport(0, payload),
      )
      expect(response.status).toBe(502)
      expect(await response.text()).not.toContain('secret provider diagnostic')
    },
  )
  it('handles provider rejection and timeout without claiming delivery', async () => {
    expect(
      (
        await handleContact(
          request(),
          env,
          transport(0, { message: 'private detail' }, 401),
        )
      ).status,
    ).toBe(502)
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ result: 0 }))
      .mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
    expect((await handleContact(request(), env, fetcher)).status).toBe(503)
  })
})
