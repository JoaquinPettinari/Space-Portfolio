import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AmbientAudio } from './AmbientAudio'

afterEach(() => vi.unstubAllGlobals())

it('does not create audio until requested and disables unavailable audio', () => {
  vi.stubGlobal('AudioContext', undefined)
  render(<AmbientAudio />)
  expect(screen.getByRole('switch', { name: 'Ambient sound' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('unavailable')
})

it('starts only on request, pauses in background, mutes and closes on unmount', async () => {
  const node = () => {
    const result = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      frequency: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      Q: { value: 0 },
    }
    result.connect.mockReturnValue(result)
    return result
  }
  const context = {
    state: 'running',
    currentTime: 0,
    sampleRate: 100,
    destination: {},
    createGain: node,
    createOscillator: node,
    createBufferSource: node,
    createBiquadFilter: node,
    createBuffer: () => ({ getChannelData: () => new Float32Array(400) }),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const constructor = vi.fn(function () {
    return context
  })
  vi.stubGlobal('AudioContext', constructor)
  const { unmount, rerender } = render(<AmbientAudio />)
  const button = screen.getByRole('switch', { name: 'Ambient sound' })
  expect(constructor).not.toHaveBeenCalled()
  fireEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute('aria-checked', 'true'))
  expect(context.resume).toHaveBeenCalledOnce()
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.suspend).toHaveBeenCalledOnce()
  hidden.mockReturnValue(false)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.resume).toHaveBeenCalledTimes(2)
  rerender(<AmbientAudio suspended />)
  expect(context.suspend).toHaveBeenCalledTimes(2)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.resume).toHaveBeenCalledTimes(2)
  expect(button).toHaveAttribute('aria-checked', 'true')
  rerender(<AmbientAudio />)
  expect(context.resume).toHaveBeenCalledTimes(3)
  expect(constructor).toHaveBeenCalledOnce()
  const scanner = vi.spyOn(context, 'createOscillator')
  rerender(<AmbientAudio scanning scanSignal={1} />)
  expect(scanner).toHaveBeenCalledOnce()
  const tone = scanner.mock.results[0].value
  expect(tone.stop).toHaveBeenCalledWith(0.55)
  rerender(<AmbientAudio scanning={false} scanSignal={1} />)
  expect(tone.disconnect).toHaveBeenCalledOnce()
  rerender(<AmbientAudio coffeeSignal={1} />)
  expect(scanner).toHaveBeenCalledTimes(2)
  fireEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute('aria-checked', 'false'))
  expect(context.suspend).toHaveBeenCalledTimes(4)
  rerender(<AmbientAudio scanning scanSignal={2} coffeeSignal={2} />)
  expect(scanner).toHaveBeenCalledTimes(2)
  unmount()
  expect(context.close).toHaveBeenCalledOnce()
  hidden.mockRestore()
})
