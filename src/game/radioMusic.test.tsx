import { afterEach, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRadioMusic, radioTrackUrl, RADIO_TRACKS } from './radioMusic'
import { useShipRadio } from './useShipRadio'
import { interactionMode, RADIO_POSITION } from './interaction/station'
import { GALLEY_RADIO } from './world/galleyLayout'

class TestAudio extends EventTarget {
  preload = ''
  volume = 1
  currentTime = 0
  duration = 0
  paused = true
  error: { code: number } | null = null
  private source = ''
  get src() {
    return this.source
  }
  set src(value: string) {
    this.source = value
    this.error = null
  }
  play = vi.fn(async () => {
    this.paused = false
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  load = vi.fn(() => {
    this.currentTime = 0
    this.error = null
  })
  removeAttribute = vi.fn((name: string) => {
    if (name === 'src') this.source = ''
  })
}

function audioBrowser() {
  const elements: TestAudio[] = []
  const constructor = vi.fn(function () {
    const audio = new TestAudio()
    elements.push(audio)
    return audio
  })
  vi.stubGlobal('Audio', constructor)
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  return { elements, constructor, hidden }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps all five file names intact in encoded radio URLs and frames the station inside the bridge', () => {
  expect(RADIO_TRACKS).toHaveLength(5)
  expect(new Set(RADIO_TRACKS.map((t) => t.file)).size).toBe(5)
  RADIO_TRACKS.forEach((track, index) => {
    expect(
      decodeURIComponent(radioTrackUrl(index).slice('/audio/radio/'.length)),
    ).toBe(track.file)
    expect(track.file).toMatch(/\.mp3$/i)
  })
  expect(interactionMode('walking', 'radio-play')).toBe('walking')
  expect(RADIO_POSITION).toEqual(GALLEY_RADIO.position)
})

it('creates no media before Play, plays the selected track and preserves playback time through suspension', async () => {
  const browser = audioBrowser()
  const { result, rerender, unmount } = renderHook(
    ({ paused }) => useShipRadio(paused),
    { initialProps: { paused: false } },
  )
  act(() => result.current.next())
  expect(result.current.track).toBe(1)
  expect(browser.constructor).not.toHaveBeenCalled()
  await act(() => result.current.toggle())
  const audio = browser.elements[0]
  expect(browser.constructor).toHaveBeenCalledOnce()
  expect(audio.preload).toBe('none')
  expect(audio.src).toBe(radioTrackUrl(1))
  expect(audio.load).not.toHaveBeenCalled()
  expect(audio.paused).toBe(false)
  audio.currentTime = 42
  audio.duration = 184
  act(() => audio.dispatchEvent(new Event('loadedmetadata')))
  expect(result.current.duration).toBe(184)
  act(() => audio.dispatchEvent(new Event('timeupdate')))
  expect(result.current.elapsed).toBe(42)
  act(() => result.current.changeVolume(0.6))
  expect(audio.volume).toBe(0.6)
  act(() => window.dispatchEvent(new Event('blur')))
  expect(audio.paused).toBe(true)
  await act(async () => {
    window.dispatchEvent(new Event('focus'))
  })
  expect(audio.paused).toBe(false)
  expect(audio.currentTime).toBe(42)
  browser.hidden.mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(audio.paused).toBe(true)
  rerender({ paused: true })
  browser.hidden.mockReturnValue(false)
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(audio.paused).toBe(true)
  rerender({ paused: false })
  await waitFor(() => expect(audio.paused).toBe(false))
  await act(() => result.current.toggle())
  expect(result.current.playing).toBe(false)
  const plays = audio.play.mock.calls.length
  await act(async () => {
    window.dispatchEvent(new Event('blur'))
    window.dispatchEvent(new Event('focus'))
  })
  expect(audio.play).toHaveBeenCalledTimes(plays)
  expect(audio.paused).toBe(true)
  unmount()
  expect(audio.src).toBe('')
  expect(audio.load).toHaveBeenCalledOnce()
})

it('automatically advances an opted-in radio, wraps selection, and recovers from a media error', async () => {
  const browser = audioBrowser()
  const { result, unmount } = renderHook(() => useShipRadio(false))
  act(() => result.current.selectTrack(4))
  await act(() => result.current.toggle())
  const audio = browser.elements[0]
  await act(async () => {
    audio.dispatchEvent(new Event('ended'))
  })
  expect(result.current.track).toBe(0)
  expect(audio.src).toBe(radioTrackUrl(0))
  expect(audio.paused).toBe(false)
  audio.error = { code: 3 }
  act(() => audio.dispatchEvent(new Event('error')))
  expect(result.current.playing).toBe(false)
  expect(result.current.error).toContain('Unable to play')
  expect(audio.paused).toBe(true)
  act(() => result.current.next())
  expect(result.current.error).toBe('')
  expect(audio.src).toBe('')
  await act(() => result.current.toggle())
  expect(audio.src).toBe(radioTrackUrl(1))
  expect(audio.paused).toBe(false)
  unmount()
})

it('never lets a delayed play completion restart a suspended or disposed media element', async () => {
  const browser = audioBrowser()
  const engine = createRadioMusic()
  const audio = browser.elements[0]
  let finish!: () => void
  audio.play.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = () => {
          audio.paused = false
          resolve()
        }
      }),
  )
  const pending = engine.resume()
  await engine.suspend()
  finish()
  await pending
  expect(audio.paused).toBe(true)
  audio.play.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = () => {
          audio.paused = false
          resolve()
        }
      }),
  )
  const unmountPending = engine.resume()
  engine.dispose()
  finish()
  await unmountPending
  expect(audio.paused).toBe(true)
  expect(audio.src).toBe('')
})

it('ignores a superseded play rejection while a newer legitimate resume is playing', async () => {
  const browser = audioBrowser()
  const { result, unmount } = renderHook(() => useShipRadio(false))
  let rejectOld!: (error: Error) => void
  // Create lazily with an unresolved first play, then blur/focus before it settles.
  const constructor = vi.fn(function () {
    const audio = new TestAudio()
    audio.play.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectOld = reject
        }),
    )
    browser.elements.push(audio)
    return audio
  })
  vi.stubGlobal('Audio', constructor)
  let first!: Promise<void>
  act(() => {
    first = result.current.toggle()
  })
  act(() => window.dispatchEvent(new Event('blur')))
  await act(async () => {
    window.dispatchEvent(new Event('focus'))
  })
  expect(browser.elements[0].paused).toBe(false)
  await act(async () => {
    rejectOld(new Error('Old playback aborted'))
    await first
  })
  expect(result.current.error).toBe('')
  expect(result.current.playing).toBe(true)
  expect(result.current.pending).toBe(false)
  expect(browser.elements[0].paused).toBe(false)
  unmount()
})

it('allows Pause while Play is pending and ignores its late completion', async () => {
  audioBrowser()
  let finish!: () => void
  const audio = new TestAudio()
  audio.play.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = () => {
          audio.paused = false
          resolve()
        }
      }),
  )
  vi.stubGlobal(
    'Audio',
    vi.fn(function () {
      return audio
    }),
  )
  const { result, unmount } = renderHook(() => useShipRadio(false))
  let pending!: Promise<void>
  act(() => {
    pending = result.current.toggle()
  })
  expect(result.current.playing).toBe(true)
  expect(result.current.pending).toBe(true)
  await act(() => result.current.toggle())
  expect(result.current.playing).toBe(false)
  expect(result.current.pending).toBe(false)
  await act(async () => {
    finish()
    await pending
  })
  expect(audio.paused).toBe(true)
  expect(result.current.playing).toBe(false)
  unmount()
})

it('reports unsupported media playback without creating an element', () => {
  vi.stubGlobal('Audio', undefined)
  const { result } = renderHook(() => useShipRadio(false))
  expect(result.current.supported).toBe(false)
})
