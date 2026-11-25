import { expect, it } from 'vitest'
import {
  dialogueMessages,
  dialogueReducer,
  initialDialogue,
  canNarrateMissionComplete,
} from './dialogue'
import { dialogueManifest } from './dialogueManifest'
it('narrates the actual tactical report once and supersedes the bridge introduction', () => {
  const introduction = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'bridgeIntroduction',
  })
  const report = dialogueReducer(introduction, {
    type: 'enqueue',
    event: 'tacticalDiagnostics',
  })
  expect(report.current).toBe('tacticalDiagnostics')
  expect(
    dialogueReducer(report, { type: 'enqueue', event: 'tacticalDiagnostics' }),
  ).toBe(report)
  expect(dialogueManifest.tacticalDiagnostics.audioUrl).toContain(
    'IA_dialog_table_result.mp3',
  )
})
it('plays actual events once and lets a verification result supersede arrival', () => {
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'arrival',
  })
  state = dialogueReducer(state, { type: 'enqueue', event: 'crewVerified' })
  expect(state.current).toBe('crewVerified')
  expect(state.queue).toEqual([])
  state = dialogueReducer(state, {
    type: 'enqueue',
    event: 'bridgeIntroduction',
  })
  expect(state.queue).toEqual(['bridgeIntroduction'])
  state = dialogueReducer(state, { type: 'dismiss' })
  expect(state.current).toBe('bridgeIntroduction')
  expect(dialogueReducer(state, { type: 'enqueue', event: 'arrival' })).toBe(
    state,
  )
  expect(
    dialogueReducer(state, { type: 'enqueue', event: 'crewVerified' }),
  ).toBe(state)
})
it('never narrates future recovery or restoration from generic events', () => {
  const state = initialDialogue()
  for (const event of [
    'recoveryProcedureFound',
    'relayRestored',
    'missionComplete',
  ] as const)
    expect(dialogueReducer(state, { type: 'enqueue', event })).toBe(state)
  expect(canNarrateMissionComplete(true, false)).toBe(false)
  expect(canNarrateMissionComplete(false, true)).toBe(false)
  expect(canNarrateMissionComplete(true, true)).toBe(true)
})
it('removes stale tablet hints and clears without rearming seen events', () => {
  let state = dialogueReducer(initialDialogue(), {
    type: 'enqueue',
    event: 'tabletPrompt',
  })
  state = dialogueReducer(state, { type: 'enqueue', event: 'tablet' })
  expect(state.current).toBe('tablet')
  state = dialogueReducer(state, { type: 'clear' })
  expect(state.current).toBeNull()
  expect(
    dialogueReducer(state, { type: 'enqueue', event: 'tabletPrompt' }),
  ).toBe(state)
  expect(dialogueReducer(state, { type: 'enqueue', event: 'tablet' })).toBe(
    state,
  )
})
it('keeps only verified media filenames and honest optional message captions', () => {
  expect(dialogueManifest.crewVerified.audioUrl).toContain('access_granted.mp3')
  expect(dialogueManifest.transmissionAccepted.audioUrl).toBeNull()
  expect(dialogueMessages.transmissionAccepted).toContain(
    'passed to the communications service',
  )
  expect(dialogueMessages.transmissionAccepted).not.toMatch(/delivered|read/)
  expect(dialogueMessages.transmissionSkipped).toContain('No message was sent')
  expect(dialogueMessages.dossier).not.toContain('downloaded')
  expect(Object.keys(dialogueManifest)).not.toEqual(
    expect.arrayContaining([
      'restored',
      'unlocking',
      'opening',
      'open',
      'complete',
    ]),
  )
})
