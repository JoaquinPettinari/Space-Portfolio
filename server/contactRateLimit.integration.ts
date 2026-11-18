/** Real Redis/Lua regression, separate from Vitest's mocked HTTP unit suite.
 * Start a local Redis, then run:
 * node --test server/contactRateLimit.integration.ts
 * Optional REDIS_CLI executable and REDIS_TEST_PORT (default 6379).
 * Uses only loopback, isolated keys and DEL; never contacts email services.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import { CONTACT_RATE_SCRIPT } from './contact.ts'

const executable = process.env.REDIS_CLI ?? 'redis-cli'
const port = process.env.REDIS_TEST_PORT ?? '6379'
assert.match(port, /^\d+$/)
assert.ok(Number(port) > 0 && Number(port) <= 65535)
const prefix = `cds:rate-regression:${randomUUID()}`
const touched = new Set<string>()
let connected = false

function redis(...args: string[]): string {
  return execFileSync(
    executable,
    ['--raw', '-h', '127.0.0.1', '-p', port, ...args],
    {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    },
  ).trim()
}

function keys(scenario: string, ip: string, sender: string): string[] {
  const result = [
    `${prefix}:${scenario}:ip:${ip}`,
    `${prefix}:${scenario}:sender:${sender}`,
    `${prefix}:${scenario}:global`,
  ]
  for (const key of result) touched.add(key)
  return result
}

function attempt(subject: string[]): number {
  const result = redis('EVAL', CONTACT_RATE_SCRIPT, '3', ...subject)
  assert.match(result, /^\d+$/, `Redis EVAL failed: ${result}`)
  return Number(result)
}

before(() => {
  assert.equal(redis('PING'), 'PONG', 'A real local Redis is required')
  connected = true
})

after(() => {
  if (connected && touched.size) redis('DEL', ...touched)
})

test('a rejected sender cannot exhaust the global quota or consume a new IP quota', () => {
  const same = keys('sender', 'one', 'one')
  for (let i = 0; i < 3; i++) assert.equal(attempt(same), 0)
  for (let i = 0; i < 51; i++) assert.ok(attempt(same) > 0)
  assert.deepEqual(
    same.map((key) => redis('GET', key)),
    ['3', '3', '3'],
  )
  const newIp = keys('sender', 'two', 'one')
  assert.ok(attempt(newIp) > 0)
  assert.equal(redis('EXISTS', newIp[0]), '0')
  assert.equal(attempt(keys('sender', 'three', 'two')), 0)
})

test('the IP limit rejects additional senders without consuming their quotas', () => {
  for (let i = 0; i < 5; i++)
    assert.equal(attempt(keys('ip', 'one', String(i))), 0)
  const rejected = keys('ip', 'one', 'new')
  for (let i = 0; i < 51; i++) assert.ok(attempt(rejected) > 0)
  assert.equal(redis('GET', rejected[0]), '5')
  assert.equal(redis('EXISTS', rejected[1]), '0')
  assert.equal(redis('GET', rejected[2]), '5')
  assert.equal(attempt(keys('ip', 'two', 'new')), 0)
})

test('global capacity remains bounded and admission resumes after expiry', () => {
  for (let i = 0; i < 50; i++)
    assert.equal(attempt(keys('global', String(i), String(i))), 0)
  const next = keys('global', 'new', 'new')
  assert.ok(attempt(next) > 0)
  assert.equal(redis('EXISTS', next[0]), '0')
  assert.equal(redis('EXISTS', next[1]), '0')
  assert.equal(redis('GET', next[2]), '50')
  // Expire only this test's global key; exercise Redis expiry without sleeping.
  assert.equal(redis('PEXPIRE', next[2], '0'), '1')
  assert.equal(attempt(next), 0)
  assert.deepEqual(
    next.map((key) => redis('GET', key)),
    ['1', '1', '1'],
  )
  const ttl = next.map((key) => Number(redis('TTL', key)))
  assert.ok(ttl[0] > 0 && ttl[0] <= 600)
  assert.ok(ttl[1] > 0 && ttl[1] <= 3600)
  assert.ok(ttl[2] > 0 && ttl[2] <= 3600)
})
