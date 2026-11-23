import { describe, expect, it } from 'vitest'
import { advanceIntroSequence } from './introSequence'
describe('event driven intro sequence', () => {
  it('waits for native playback and ending rather than elapsed page time', () => {
    expect(advanceIntroSequence('loading-exterior', 'ready', true)).toBe(
      'loading-exterior',
    )
    expect(advanceIntroSequence('loading-exterior', 'playing', true)).toBe(
      'cinematic',
    )
    expect(advanceIntroSequence('cinematic', 'ready', true)).toBe('cinematic')
    expect(advanceIntroSequence('cinematic', 'ended', true)).toBe('fading')
  })
  it('waits behind black until real interior readiness and compositor completion', () => {
    expect(advanceIntroSequence('fading', 'fade-ended', false)).toBe(
      'waiting-interior',
    )
    expect(advanceIntroSequence('waiting-interior', 'ready', true)).toBe(
      'revealing',
    )
    expect(advanceIntroSequence('revealing', 'reveal-ended', false)).toBe(
      'revealing',
    )
    expect(advanceIntroSequence('revealing', 'reveal-ended', true)).toBe(
      'complete',
    )
  })
  it('recovers failures and lost readiness without exposing an unfinished interior', () => {
    expect(advanceIntroSequence('cinematic', 'error', false)).toBe('failed')
    expect(advanceIntroSequence('failed', 'skip', false)).toBe(
      'waiting-interior',
    )
    expect(advanceIntroSequence('failed', 'retry', false)).toBe(
      'loading-exterior',
    )
    expect(advanceIntroSequence('revealing', 'unready', false)).toBe(
      'waiting-interior',
    )
    expect(advanceIntroSequence('complete', 'retry', true)).toBe('complete')
  })
})
