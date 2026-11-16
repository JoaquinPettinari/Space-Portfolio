// @vitest-environment node
import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import { auditSpecs, productionSpecs, regressionSpecs } from '../../e2e/suites'

it('assigns every E2E spec exactly once to regression, audit or production', () => {
  const files = readdirSync('e2e', { recursive: true, encoding: 'utf8' })
    .map((name) => name.replaceAll('\\', '/'))
    .filter((name) => name.endsWith('.spec.ts'))
    .sort()
  const classified = [...regressionSpecs, ...auditSpecs, ...productionSpecs]
  expect(new Set(classified).size).toBe(classified.length)
  expect([...classified].sort()).toEqual(files)
})
