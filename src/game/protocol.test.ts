import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  getCurrentObjective,
  initialProtocol,
  loadProtocol,
  parseProtocol,
  PROTOCOL_STORAGE_KEY,
  protocolReducer,
  saveProtocol,
  type ProtocolState,
} from './protocol'
import { useProtocol } from './useProtocol'

describe('recovery protocol', () => {
  it('guides the first pending objective while preserving out-of-order activities', () => {
    let state = protocolReducer(initialProtocol(), {
      type: 'activity',
      id: 'crew',
    })
    expect(getCurrentObjective(state)?.id).toBe('lighting')
    state = protocolReducer(state, { type: 'activity', id: 'lighting' })
    expect(getCurrentObjective(state)?.id).toBe('tablet')
    state = protocolReducer(state, { type: 'activity', id: 'tablet' })
    expect(getCurrentObjective(state)?.id).toBe('archives')
    expect(state.guidance).toBe('pending')
  })
  it('skips guidance without erasing progress and records activities while skipped', () => {
    let state = protocolReducer(initialProtocol(), { type: 'skip' })
    expect(getCurrentObjective(state)).toBeNull()
    state = protocolReducer(state, { type: 'activity', id: 'dossier' })
    expect(state.completed).toEqual(['dossier'])
    state = protocolReducer(state, { type: 'continue' })
    expect(state.guidance).toBe('active')
    expect(getCurrentObjective(state)?.id).toBe('lighting')
  })
  it('replays the protocol without switching restored lighting off', () => {
    const state: ProtocolState = {
      version: 1,
      completed: ['lighting', 'tablet', 'crew'],
      guidance: 'skipped',
    }
    const replay = protocolReducer(state, { type: 'replay' })
    expect(replay.completed).toEqual(['lighting'])
    expect(replay.guidance).toBe('active')
    expect(getCurrentObjective(replay)?.id).toBe('tablet')
    expect(
      protocolReducer(initialProtocol(), { type: 'replay' }).completed,
    ).toEqual([])
  })
  it('does not mark email drafts as sent or duplicate archive progress', () => {
    const state = protocolReducer(initialProtocol(), {
      type: 'activity',
      id: 'diagnostics',
    })
    expect(protocolReducer(state, { type: 'activity', id: 'archives' })).toBe(
      state,
    )
    expect(protocolReducer(state, { type: 'activity', id: 'uplink' })).toBe(
      state,
    )
  })
  it('has no current objective when every step is complete', () => {
    expect(
      getCurrentObjective({
        version: 1,
        guidance: 'active',
        completed: [
          'lighting',
          'tablet',
          'crew',
          'archives',
          'uplink',
          'dossier',
        ],
      }),
    ).toBeNull()
  })
})

describe('versioned persistence', () => {
  it.each([
    null,
    '',
    '{',
    'null',
    '[]',
    '42',
    '{"version":0,"completed":["uplink"],"guidance":"active"}',
    '{"version":2,"completed":[],"guidance":"active"}',
    '{"version":1,"completed":["unknown"],"guidance":"active"}',
    '{"version":1,"completed":[],"guidance":"invalid"}',
  ])('safely resets missing, malformed or unsupported data: %s', (raw) => {
    expect(parseProtocol(raw)).toEqual(initialProtocol())
  })
  it('restores preferences and deduplicates known objectives', () => {
    expect(
      parseProtocol(
        JSON.stringify({
          version: 1,
          guidance: 'skipped',
          completed: ['crew', 'crew', 'lighting'],
        }),
      ),
    ).toEqual({
      version: 1,
      guidance: 'skipped',
      completed: ['crew', 'lighting'],
    })
  })
  it('roundtrips state and tolerates storage access or quota errors', () => {
    const state = protocolReducer(initialProtocol(), { type: 'skip' })
    const storage = {
      getItem: vi.fn(() => JSON.stringify(state)),
      setItem: vi.fn(),
    }
    expect(loadProtocol(storage)).toEqual(state)
    expect(saveProtocol(state, storage)).toBe(true)
    expect(storage.setItem).toHaveBeenCalledWith(
      PROTOCOL_STORAGE_KEY,
      JSON.stringify(state),
    )
    const unavailable = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(loadProtocol(unavailable)).toEqual(initialProtocol())
    expect(saveProtocol(state, unavailable)).toBe(false)
  })
  it('persists hook actions and restores them on remount', () => {
    localStorage.removeItem(PROTOCOL_STORAGE_KEY)
    const first = renderHook(() => useProtocol())
    act(() => {
      first.result.current.dispatch({ type: 'activity', id: 'lighting' })
      first.result.current.dispatch({ type: 'skip' })
    })
    first.unmount()
    const second = renderHook(() => useProtocol())
    expect(second.result.current.state.completed).toEqual(['lighting'])
    expect(second.result.current.state.guidance).toBe('skipped')
    second.unmount()
    localStorage.removeItem(PROTOCOL_STORAGE_KEY)
  })
})
