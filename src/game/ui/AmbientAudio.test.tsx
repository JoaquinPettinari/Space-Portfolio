import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AmbientAudio } from './AmbientAudio'

afterEach(() => vi.unstubAllGlobals())

it('does not create audio until requested and disables unavailable audio', () => {
  vi.stubGlobal('AudioContext', undefined)
  render(<AmbientAudio />)
  expect(screen.getByRole('button', { name: 'Ambient sound' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('unavailable')
})

it('starts only on request, pauses in background, mutes and closes on unmount', async () => {
  const node = () => {
    const result = {
      connect: vi.fn(),
      start: vi.fn(),
      gain: { value: 0 },
      frequency: { value: 0 },
      Q: { value: 0 },
    }
    result.connect.mockReturnValue(result)
    return result
  }
  const context = {
    state: 'running',
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
  const { unmount } = render(<AmbientAudio />)
  const button = screen.getByRole('button', { name: 'Ambient sound' })
  expect(constructor).not.toHaveBeenCalled()
  fireEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
  expect(context.resume).toHaveBeenCalledOnce()
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.suspend).toHaveBeenCalledOnce()
  hidden.mockReturnValue(false)
  fireEvent(document, new Event('visibilitychange'))
  expect(context.resume).toHaveBeenCalledTimes(2)
  fireEvent.click(button)
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
  expect(context.suspend).toHaveBeenCalledTimes(2)
  unmount()
  expect(context.close).toHaveBeenCalledOnce()
  hidden.mockRestore()
})
