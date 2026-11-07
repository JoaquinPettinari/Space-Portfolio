import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import {
  isEmail,
  validateContact,
  type ContactMessage,
} from '../shared/contact.ts'

type Environment = Record<string, string | undefined>
type ContactConfig = {
  origin: string
  from: string
  to: string
  apiKey: string
  redisUrl: string
  redisToken: string
  rateSecret: string
}

const MAX_BODY_BYTES = 24_000
const UNAVAILABLE =
  'Transmission unavailable. Please try again later or use the email link.'

function configuration(env: Environment): ContactConfig | null {
  try {
    const origin = new URL(env.CONTACT_ORIGIN ?? '')
    const redis = new URL(env.UPSTASH_REDIS_REST_URL ?? '')
    if (
      origin.protocol !== 'https:' ||
      origin.origin !== env.CONTACT_ORIGIN ||
      redis.protocol !== 'https:' ||
      !redis.hostname.endsWith('.upstash.io') ||
      redis.username ||
      redis.password ||
      redis.search ||
      redis.hash ||
      !isEmail(env.CONTACT_FROM ?? '') ||
      !isEmail(env.CONTACT_TO ?? '') ||
      !env.RESEND_API_KEY ||
      !env.UPSTASH_REDIS_REST_TOKEN ||
      !env.CONTACT_RATE_SECRET ||
      env.CONTACT_RATE_SECRET.length < 32
    )
      return null
    return {
      origin: origin.origin,
      from: env.CONTACT_FROM!,
      to: env.CONTACT_TO!,
      apiKey: env.RESEND_API_KEY,
      redisUrl: redis.origin,
      redisToken: env.UPSTASH_REDIS_REST_TOKEN,
      rateSecret: env.CONTACT_RATE_SECRET,
    }
  } catch {
    return null
  }
}

function reply(
  status: number,
  body: object,
  extra: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  })
}

async function readBody(request: Request): Promise<unknown> {
  const declared = request.headers.get('content-length')
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  )
    throw new RangeError('body size')
  if (!request.body) throw new SyntaxError('empty body')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new RangeError('body size')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

// Atomic limits shared by all function instances. Counters expire automatically.
// Per-IP (5/10 min), per-sender (3/hour), global (50/hour) caps bound abuse and cost.
const RATE_SCRIPT = `
local limits = {5, 3, 50}
local windows = {600, 3600, 3600}
local retry = 0
for i = 1, 3 do
  local count = redis.call('INCR', KEYS[i])
  if count == 1 then redis.call('EXPIRE', KEYS[i], windows[i]) end
  if count > limits[i] then retry = math.max(retry, 1, redis.call('TTL', KEYS[i])) end
end
return retry
`

function digest(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

async function rateLimit(
  config: ContactConfig,
  ip: string,
  email: string,
  fetcher: typeof fetch,
): Promise<number> {
  const response = await fetcher(config.redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      'EVAL',
      RATE_SCRIPT,
      '3',
      `cds:contact:ip:${digest(config.rateSecret, ip)}`,
      `cds:contact:email:${digest(config.rateSecret, email.toLowerCase())}`,
      'cds:contact:global',
    ]),
    signal: AbortSignal.timeout(4000),
    redirect: 'error',
  })
  if (!response.ok) throw new Error('rate service')
  const result: unknown = await response.json()
  if (
    !result ||
    typeof result !== 'object' ||
    !('result' in result) ||
    typeof result.result !== 'number' ||
    !Number.isInteger(result.result) ||
    result.result < 0
  )
    throw new Error('rate response')
  return result.result
}

export async function sendWithResend(
  config: Pick<ContactConfig, 'from' | 'to' | 'apiKey' | 'rateSecret'>,
  message: ContactMessage,
  fetcher: typeof fetch,
): Promise<boolean> {
  // Stable for identical payload retries; Resend expires idempotency keys after 24 h.
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `cds-${digest(config.rateSecret, JSON.stringify([config.from, config.to, message]))}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: message.email,
      subject: 'CRUZ DEL SUR — Portfolio transmission',
      text: `From: ${message.name}\nReply to: ${message.email}\n\n${message.message}`,
    }),
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  })
  if (!response.ok) return false
  const result: unknown = await response.json()
  return (
    !!result &&
    typeof result === 'object' &&
    'id' in result &&
    typeof result.id === 'string' &&
    result.id.length > 0 &&
    !('error' in result)
  )
}

export async function handleContact(
  request: Request,
  env: Environment,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST')
    return reply(405, { error: 'Use POST.' }, { Allow: 'POST' })
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return reply(415, { error: 'Send JSON.' })
  const config = configuration(env)
  if (!config) return reply(503, { error: UNAVAILABLE })
  // Browser protection, not authentication: durable rate limits also cover direct HTTP callers.
  if (request.headers.get('origin') !== config.origin)
    return reply(403, { error: 'Origin not allowed.' })
  // Trust only Vercel's overwritten client-IP header, never arbitrary forwarded lists.
  const ip = request.headers.get('x-vercel-forwarded-for') ?? ''
  if (!isIP(ip)) return reply(503, { error: UNAVAILABLE })
  let input: unknown
  try {
    input = await readBody(request)
  } catch (error) {
    return reply(error instanceof RangeError ? 413 : 400, {
      error: 'Invalid transmission payload.',
    })
  }
  const validation = validateContact(input)
  if (validation.error) return reply(400, { error: validation.error })
  if (!validation.data)
    return reply(400, { error: 'Invalid transmission payload.' })
  try {
    const retry = await rateLimit(config, ip, validation.data.email, fetcher)
    if (retry > 0)
      return reply(
        429,
        { error: 'Transmission limit reached. Please try again later.' },
        { 'Retry-After': String(retry) },
      )
    if (await sendWithResend(config, validation.data, fetcher))
      return reply(200, { accepted: true })
    return reply(502, { error: UNAVAILABLE })
  } catch {
    return reply(503, { error: UNAVAILABLE })
  }
}
