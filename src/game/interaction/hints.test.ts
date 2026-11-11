import { expect, it } from 'vitest'
import { interactionHint } from './hints'

it('directs the visitor to credentials regardless of legacy lighting state', () => {
  expect(interactionHint('bulkhead', false, 'idle')).toBe(
    'Use Crew Access to open the bulkhead',
  )
  expect(interactionHint('bulkhead', true, 'idle')).toBe(
    'Use Crew Access to open the bulkhead',
  )
})
it('distinguishes preparing and drinking coffee without an unrelated fallback', () => {
  expect(interactionHint('coffee', true, 'brewing')).toBe('Coffee brewing…')
  expect(interactionHint('coffee', true, 'ready')).toBe('E Drink coffee')
  expect(interactionHint(null, true, 'ready')).toBe('')
})
