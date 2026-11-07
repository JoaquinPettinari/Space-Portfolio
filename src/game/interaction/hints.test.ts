import { expect, it } from 'vitest'
import { interactionHint } from './hints'

it('does not offer opening the bulkhead until auxiliary power is restored', () => {
  expect(interactionHint('bulkhead', false, 'idle')).toBe(
    'Restore auxiliary power first',
  )
  expect(interactionHint('bulkhead', true, 'idle')).toBe('E · Open bulkhead')
})
it('distinguishes preparing and drinking coffee without an unrelated fallback', () => {
  expect(interactionHint('coffee', true, 'brewing')).toBe('Coffee brewing…')
  expect(interactionHint('coffee', true, 'ready')).toBe('E · Drink coffee')
  expect(interactionHint(null, true, 'ready')).toBe('')
})
