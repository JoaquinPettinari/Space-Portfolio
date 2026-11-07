import { expect, it } from 'vitest'
import {
  dialogueMessages,
  dialogueReducer,
  DIALOGUE_DURATION_MS,
  initialDialogue,
} from './dialogue'

it('queues events once, in order, including events received after dismissal', () => {
  const initial = initialDialogue()
  const first = dialogueReducer(initial, { type: 'enqueue', event: 'identity' })
  const second = dialogueReducer(first, { type: 'enqueue', event: 'archives' })
  expect(dialogueReducer(second, { type: 'enqueue', event: 'archives' })).toBe(
    second,
  )
  expect(second.current).toBe('identity')
  expect(second.queue).toEqual(['archives'])
  const next = dialogueReducer(second, { type: 'dismiss' })
  expect(next.current).toBe('archives')
  expect(dialogueReducer(next, { type: 'enqueue', event: 'identity' })).toBe(
    next,
  )
  expect(initial).toEqual(initialDialogue())
})

it('supersedes outdated entry instructions rather than narrating a door that has already opened', () => {
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'arrival',
  })
  for (const event of ['restored', 'unlocking', 'opening', 'open'] as const) {
    state = dialogueReducer(state, { type: 'enqueue', event })
    expect(state.current).toBe(event)
    expect(state.queue).toEqual([])
  }
  expect(dialogueReducer(state, { type: 'enqueue', event: 'arrival' })).toBe(
    state,
  )
  const alreadyOpen = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'open',
  })
  expect(
    dialogueReducer(alreadyOpen, { type: 'enqueue', event: 'unlocking' }),
  ).toBe(alreadyOpen)
})

it('retains normal dialogue while replacing stale queued entry messages', () => {
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'tablet',
  })
  state = dialogueReducer(state, { type: 'enqueue', event: 'restored' })
  state = dialogueReducer(state, { type: 'enqueue', event: 'open' })
  expect(state.current).toBe('tablet')
  expect(state.queue).toEqual(['open'])
})

it('removes both visible and queued tablet prompts when the tablet has already opened', () => {
  const prompt = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'tabletPrompt',
  })
  expect(
    dialogueReducer(prompt, { type: 'enqueue', event: 'tablet' }).current,
  ).toBe('tablet')
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'open',
  })
  state = dialogueReducer(state, { type: 'enqueue', event: 'tabletPrompt' })
  state = dialogueReducer(state, { type: 'enqueue', event: 'tablet' })
  expect(state.queue).toEqual(['tablet'])
  const earlyTablet = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'tablet',
  })
  expect(
    dialogueReducer(earlyTablet, { type: 'enqueue', event: 'tabletPrompt' }),
  ).toBe(earlyTablet)
})

it('clears pending lines without allowing repeated interactions to replay them', () => {
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'dossier',
  })
  state = dialogueReducer(state, { type: 'enqueue', event: 'complete' })
  state = dialogueReducer(state, { type: 'clear' })
  expect(state.current).toBeNull()
  expect(state.queue).toEqual([])
  expect(dialogueReducer(state, { type: 'enqueue', event: 'complete' })).toBe(
    state,
  )
})

it('keeps factual delivery semantics and readable durations without requiring voice audio', () => {
  expect(dialogueMessages.transmissionAccepted).toContain(
    'accepted by the email provider',
  )
  expect(dialogueMessages.transmissionAccepted).not.toContain('delivered')
  expect(dialogueMessages.transmissionSkipped).toContain('No email was sent')
  expect(dialogueMessages.dossier).not.toContain('downloaded')
  for (const duration of Object.values(DIALOGUE_DURATION_MS)) {
    expect(duration).toBeGreaterThanOrEqual(4000)
    expect(duration).toBeLessThanOrEqual(12000)
  }
})
