import { readFileSync } from 'node:fs'

// Vercel and the local production preview use one canonical policy.
// Keep this Node-only module out of the browser application.
export function readSecurityHeaders(): Record<string, string> {
  const config: unknown = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
  )
  if (
    !config ||
    typeof config !== 'object' ||
    !('headers' in config) ||
    !Array.isArray(config.headers)
  )
    throw new Error('vercel.json must define deployment headers.')
  const entry: unknown = config.headers.find(
    (candidate: unknown) =>
      !!candidate &&
      typeof candidate === 'object' &&
      'source' in candidate &&
      candidate.source === '/(.*)',
  )
  if (
    !entry ||
    typeof entry !== 'object' ||
    !('headers' in entry) ||
    !Array.isArray(entry.headers)
  )
    throw new Error('vercel.json must define a global header policy.')
  const headers: Record<string, string> = {}
  const entries: unknown[] = entry.headers
  for (const header of entries) {
    if (
      !header ||
      typeof header !== 'object' ||
      !('key' in header) ||
      !('value' in header) ||
      typeof header.key !== 'string' ||
      typeof header.value !== 'string'
    )
      throw new Error('Invalid deployment header entry.')
    headers[header.key] = header.value
  }
  if (!headers['Content-Security-Policy'])
    throw new Error('Deployment CSP is required.')
  return headers
}
