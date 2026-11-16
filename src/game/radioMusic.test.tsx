import { afterEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { radioNotes, RADIO_TRACKS } from './radioMusic'
import { useShipRadio } from './useShipRadio'
import { RadioPanel } from './ui/RadioPanel'
import {
  interactionMode,
  RADIO_POSITION,
  stationView,
  TERMINAL_SCREENS,
} from './interaction/station'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('has two distinct bounded original scores and frames the radio from inside the bridge', () => {
  expect(RADIO_TRACKS).toHaveLength(2)
  for (let track = 0; track < 2; track++)
    for (let step = 0; step < 128; step++) {
      const notes = radioNotes(track, step)
      expect(notes.length).toBeLessThanOrEqual(5)
      for (const note of notes) {
        expect(note.midi).toBeGreaterThan(30)
        expect(note.midi).toBeLessThan(90)
        expect(note.seconds).toBeLessThanOrEqual(1.8)
      }
    }
  expect(radioNotes(0, 0)).not.toEqual(radioNotes(1, 0))
  expect(interactionMode('walking', 'radio')).toBe('radio')
  const view = stationView('radio')
  expect(view.position[0]).toBeGreaterThan(RADIO_POSITION[0])
  expect(view.position[0]).toBeLessThan(-2)
  expect(view.lookAt).toEqual(TERMINAL_SCREENS.radio.position)
})

it('opts in only on play, changes tracks and volume, pauses while hidden and disposes the scheduler', async () => {
  const nodes: ReturnType<typeof node>[] = []
  function node() {
    const result = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      frequency: { value: 0 },
    }
    result.connect.mockReturnValue(result)
    return result
  }
  const createNode = () => {
    const result = node()
    nodes.push(result)
    return result
  }
  const context = {
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: createNode,
    createOscillator: createNode,
    createBiquadFilter: createNode,
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const constructor = vi.fn(function () {
    return context
  })
  vi.stubGlobal('AudioContext', constructor)
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const interval = vi.spyOn(window, 'setInterval')
  const clear = vi.spyOn(window, 'clearInterval')
  const leave = vi.fn()
  function Harness({ paused = false }: { paused?: boolean }) {
    const radio = useShipRadio(paused)
    return <RadioPanel radio={radio} onClose={leave} />
  }
  const { rerender, unmount } = render(<Harness />)
  expect(constructor).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Next radio track' }))
  expect(screen.getByText('Night Watch')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Play radio' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Pause radio' })).toBeEnabled(),
  )
  expect(constructor).toHaveBeenCalledOnce()
  expect(context.resume).toHaveBeenCalledOnce()
  expect(nodes.filter((n) => n.start.mock.calls.length)).toHaveLength(5)
  fireEvent.change(screen.getByRole('slider', { name: 'Radio volume' }), {
    target: { value: '.6' },
  })
  expect(nodes[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0.6, 0, 0.03)
  hidden.mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.suspend).toHaveBeenCalledOnce()
  hidden.mockReturnValue(false)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.resume).toHaveBeenCalledTimes(2)
  fireEvent(window, new Event('blur'))
  expect(context.suspend).toHaveBeenCalledTimes(2)
  fireEvent(window, new Event('focus'))
  expect(context.resume).toHaveBeenCalledTimes(3)
  rerender(<Harness paused />)
  expect(context.suspend).toHaveBeenCalledTimes(3)
  fireEvent.click(screen.getByRole('button', { name: 'Leave radio' }))
  expect(leave).toHaveBeenCalledOnce()
  unmount()
  expect(clear).toHaveBeenCalledWith(interval.mock.results[0].value)
  expect(context.close).toHaveBeenCalledOnce()
})

it('disables play where WebAudio is unavailable', () => {
  vi.stubGlobal('AudioContext', undefined)
  function Harness() {
    return <RadioPanel radio={useShipRadio(false)} onClose={() => {}} />
  }
  render(<Harness />)
  expect(screen.getByRole('button', { name: 'Play radio' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('unavailable')
})
