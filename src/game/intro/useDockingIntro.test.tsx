import * as React from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
let introModule: typeof import('./useDockingIntro')
let reduced = false
let preferenceChanged: (() => void) | undefined
beforeEach(async () => {
  vi.resetModules()
  vi.doMock('react', () => React)
  reduced = false
  preferenceChanged = undefined
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduced
    },
    addEventListener: vi.fn((_event: string, callback: () => void) => {
      preferenceChanged = callback
    }),
    removeEventListener: vi.fn(),
  }))
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  introModule = await import('./useDockingIntro')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.doUnmock('react')
})
function media() {
  const video = document.createElement('video')
  let callback: VideoFrameRequestCallback | undefined
  Object.defineProperties(video, {
    duration: { value: 8 },
    buffered: {
      configurable: true,
      value: { length: 1, start: () => 0, end: () => 3 },
    },
    requestVideoFrameCallback: {
      value: vi.fn((next: VideoFrameRequestCallback) => {
        callback = next
        return 1
      }),
    },
    cancelVideoFrameCallback: { value: vi.fn() },
  })
  return {
    video,
    present: () => callback?.(0, {} as VideoFrameCallbackMetadata),
    buffer: () =>
      Object.defineProperty(video, 'buffered', {
        value: { length: 1, start: () => 0, end: () => 8 },
      }),
  }
}
it('starts background game only after a presented frame and the whole movie is buffered', () => {
  const { result } = renderHook(() => introModule.useDockingIntro())
  const movie = media()
  act(() => {
    result.current.videoRef(movie.video)
    result.current.onVideoPlaying()
  })
  expect(result.current.phase).toBe('cinematic')
  act(() => movie.present())
  expect(result.current.shouldLoadGame).toBe(false)
  act(() => {
    movie.buffer()
    result.current.onVideoProgress()
  })
  expect(result.current.shouldLoadGame).toBe(true)
  expect(result.current.phase).toBe('cinematic')
})
it('does not reveal until media ended, fade completed and the interior is ready', () => {
  const { result } = renderHook(() => introModule.useDockingIntro())
  act(() => result.current.onVideoEnded())
  expect(result.current.phase).toBe('fading')
  act(() => result.current.onPresentationEnd('docking-fade'))
  expect(result.current.phase).toBe('waiting-interior')
  act(() => result.current.setInteriorReady(true))
  expect(result.current.phase).toBe('revealing')
  act(() => result.current.onPresentationEnd('docking-open-right'))
  expect(result.current.complete).toBe(false)
  act(() => result.current.onPresentationEnd('docking-open-left'))
  expect(result.current.complete).toBe(true)
})
it('persists completion and claims welcome once across remounts', () => {
  const first = renderHook(() => introModule.useDockingIntro(), {
    wrapper: React.StrictMode,
  })
  act(() => {
    first.result.current.setInteriorReady(true)
    first.result.current.continueWithoutVideo()
  })
  act(() => first.result.current.onPresentationEnd('docking-open-left'))
  expect(introModule.claimArrivalWelcome()).toBe(true)
  first.unmount()
  const next = renderHook(() => introModule.useDockingIntro())
  expect(next.result.current.complete).toBe(true)
  expect(next.result.current.shouldLoadGame).toBe(true)
  expect(introModule.claimArrivalWelcome()).toBe(false)
})
it('offers retry or safe continuation after video failure', () => {
  const { result } = renderHook(() => introModule.useDockingIntro())
  act(() => result.current.onVideoError())
  expect(result.current.phase).toBe('failed')
  act(() => result.current.retryVideo())
  expect(result.current.phase).toBe('loading-exterior')
  expect(result.current.videoAttempt).toBe(1)
  act(() => {
    result.current.onVideoError()
    result.current.continueWithoutVideo()
  })
  expect(result.current.phase).toBe('waiting-interior')
  expect(result.current.shouldLoadGame).toBe(true)
})
it('uses reduced motion without playing a video and waits for readiness', () => {
  reduced = true
  const { result } = renderHook(() => introModule.useDockingIntro())
  expect(result.current.reducedMotion).toBe(true)
  expect(result.current.shouldLoadGame).toBe(true)
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  act(() => {
    result.current.onPresentationEnd('docking-still')
  })
  act(() => {
    result.current.onPresentationEnd('docking-fade')
  })
  expect(result.current.phase).toBe('waiting-interior')
})
it('pauses native playback while suspended or hidden', () => {
  const { result, rerender } = renderHook(
    ({ suspended }) => introModule.useDockingIntro(suspended),
    { initialProps: { suspended: false } },
  )
  const movie = media()
  act(() => {
    result.current.videoRef(movie.video)
    result.current.onVideoPlaying()
  })
  rerender({ suspended: true })
  expect(movie.video.pause).toHaveBeenCalled()
  expect(result.current.paused).toBe(true)
  rerender({ suspended: false })
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current.paused).toBe(true)
})
it('reports autoplay denial so a native user gesture can resume it', async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
    new DOMException('Denied', 'NotAllowedError'),
  )
  const { result } = renderHook(() => introModule.useDockingIntro())
  const movie = media()
  await act(async () => {
    result.current.videoRef(movie.video)
    result.current.playVideo()
  })
  expect(result.current.playbackBlocked).toBe(true)
  vi.mocked(HTMLMediaElement.prototype.play).mockResolvedValue()
  await act(async () => {
    result.current.playVideo()
    result.current.onVideoPlaying()
  })
  expect(result.current.playbackBlocked).toBe(false)
})

it('switches to a static presentation when reduced motion is enabled during playback', () => {
  const { result } = renderHook(() => introModule.useDockingIntro())
  const movie = media()
  act(() => {
    result.current.videoRef(movie.video)
    result.current.onVideoPlaying()
  })
  act(() => {
    reduced = true
    preferenceChanged?.()
  })
  expect(result.current.reducedMotion).toBe(true)
  expect(result.current.shouldLoadGame).toBe(true)
  act(() => result.current.onPresentationEnd('docking-still'))
  expect(result.current.phase).toBe('fading')
})

it('restores movie position across remounts and cancels pending presentation callbacks', () => {
  const first = renderHook(() => introModule.useDockingIntro())
  const movie = media()
  act(() => {
    first.result.current.videoRef(movie.video)
    first.result.current.onVideoPlaying()
    movie.video.currentTime = 3
    first.result.current.onVideoProgress()
  })
  act(() => first.result.current.videoRef(null))
  expect(movie.video.cancelVideoFrameCallback).toHaveBeenCalledWith(1)
  first.unmount()
  const next = renderHook(() => introModule.useDockingIntro())
  const resumed = media()
  act(() => {
    next.result.current.videoRef(resumed.video)
    next.result.current.onVideoMetadata()
  })
  expect(resumed.video.currentTime).toBe(3)
  expect(next.result.current.phase).toBe('cinematic')
})

it('clears autoplay recovery controls when continuing without the movie', async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
    new DOMException('Denied', 'NotAllowedError'),
  )
  const { result } = renderHook(() => introModule.useDockingIntro())
  const movie = media()
  await act(async () => {
    result.current.videoRef(movie.video)
    result.current.playVideo()
  })
  expect(result.current.playbackBlocked).toBe(true)
  act(() => result.current.continueWithoutVideo())
  expect(result.current.playbackBlocked).toBe(false)
  expect(result.current.phase).toBe('waiting-interior')
  expect(result.current.shouldLoadGame).toBe(true)
  act(() => result.current.setInteriorReady(true))
  expect(result.current.phase).toBe('revealing')
  expect(result.current.playbackBlocked).toBe(false)
})
