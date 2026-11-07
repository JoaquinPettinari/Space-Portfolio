import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  getCurrentObjective,
  initialProtocol,
  PROTOCOL_STORAGE_KEY,
  protocolReducer,
  type ProtocolState,
} from './protocol'
import { useProtocol } from './useProtocol'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem(PROTOCOL_STORAGE_KEY)
  localStorage.removeItem('cruz-del-sur.test-preference')
})

describe('recovery protocol', () => {
  it.each(['accepted', 'skipped'] as const)(
    'completes uplink only after explicit %s outcome',
    (outcome) => {
      const state = protocolReducer(initialProtocol(), {
        type: 'transmission',
        outcome,
      })
      expect(state.completed).toEqual(['uplink'])
      expect(protocolReducer(state, { type: 'transmission', outcome })).toBe(
        state,
      )
    },
  )
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

describe('session-only progress', () => {
  it('ignores and removes legacy progress without deleting unrelated preferences', () => {
    localStorage.setItem(
      PROTOCOL_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: [
          'lighting',
          'tablet',
          'crew',
          'archives',
          'uplink',
          'dossier',
        ],
        guidance: 'skipped',
      }),
    )
    localStorage.setItem('cruz-del-sur.test-preference', 'keep')
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useProtocol())
    expect(result.current.state).toEqual(initialProtocol())
    expect(localStorage.getItem(PROTOCOL_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('cruz-del-sur.test-preference')).toBe('keep')
    act(() => result.current.dispatch({ type: 'activity', id: 'lighting' }))
    expect(writes).not.toHaveBeenCalled()
  })
  it('resets every completed objective and tutorial choice on a fresh mount', () => {
    const first = renderHook(() => useProtocol())
    act(() => {
      for (const id of [
        'lighting',
        'tablet',
        'crew',
        'archives',
        'dossier',
      ] as const) {
        first.result.current.dispatch({ type: 'activity', id })
      }
      first.result.current.dispatch({
        type: 'transmission',
        outcome: 'accepted',
      })
      first.result.current.dispatch({ type: 'skip' })
    })
    expect(first.result.current.state.completed).toHaveLength(6)
    expect(first.result.current.state.guidance).toBe('skipped')
    first.unmount()
    const second = renderHook(() => useProtocol())
    expect(second.result.current.state).toEqual(initialProtocol())
    expect(second.result.current.currentObjective?.id).toBe('lighting')
    expect(localStorage.getItem(PROTOCOL_STORAGE_KEY)).toBeNull()
  })
  it('works when removal of legacy browser storage is denied', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useProtocol())
    expect(result.current.state).toEqual(initialProtocol())
    act(() =>
      result.current.dispatch({ type: 'transmission', outcome: 'skipped' }),
    )
    expect(result.current.state.completed).toEqual(['uplink'])
  })
})
