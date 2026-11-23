import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createDialoguePlayback, type VoiceMedia } from './dialoguePlayback'
import type { DialogueLine } from './dialogueManifest'
class Media extends EventTarget implements VoiceMedia {
  src = ''
  currentTime = 0
  duration = 12
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  load = vi.fn()
}
const line: DialogueLine = {
  audioUrl: '/verified.mp3',
  caption: 'Caption',
  durationMs: 6000,
  priority: 10,
  enabled: true,
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
it('shows timed captions without creating audio when sound is off', () => {
  const ended = vi.fn(),
    makeMedia = vi.fn(() => new Media())
  const controller = createDialoguePlayback(line, ended, vi.fn(), makeMedia)
  controller.setOptions({ paused: false, soundEnabled: false })
  vi.advanceTimersByTime(2000)
  controller.setOptions({ paused: true, soundEnabled: false })
  vi.advanceTimersByTime(20000)
  expect(ended).not.toHaveBeenCalled()
  controller.setOptions({ paused: false, soundEnabled: false })
  vi.advanceTimersByTime(4000)
  expect(ended).toHaveBeenCalledOnce()
  expect(makeMedia).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
it('uses real metadata duration and pauses both media and captions during buffering/background', async () => {
  const media = new Media(),
    ended = vi.fn(),
    speaking = vi.fn()
  const controller = createDialoguePlayback(line, ended, speaking, () => media)
  controller.setOptions({ paused: false, soundEnabled: true })
  media.dispatchEvent(new Event('loadedmetadata'))
  media.dispatchEvent(new Event('playing'))
  media.currentTime = 2
  vi.advanceTimersByTime(2000)
  media.dispatchEvent(new Event('waiting'))
  vi.advanceTimersByTime(20000)
  expect(ended).not.toHaveBeenCalled()
  media.dispatchEvent(new Event('playing'))
  controller.setOptions({ paused: true, soundEnabled: true })
  expect(media.pause).toHaveBeenCalled()
  vi.advanceTimersByTime(20000)
  expect(ended).not.toHaveBeenCalled()
  controller.setOptions({ paused: false, soundEnabled: true })
  expect(media.currentTime).toBe(2)
  media.dispatchEvent(new Event('playing'))
  controller.setOptions({ paused: false, soundEnabled: false })
  vi.advanceTimersByTime(9999)
  expect(ended).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(ended).toHaveBeenCalledOnce()
  expect(speaking).toHaveBeenLastCalledWith(false)
  await Promise.resolve()
})
it('blocked autoplay keeps captions running and retries only explicitly, at the current caption position', async () => {
  const media = new Media(),
    ended = vi.fn()
  media.play.mockRejectedValueOnce(
    new DOMException('Blocked', 'NotAllowedError'),
  )
  const controller = createDialoguePlayback(line, ended, vi.fn(), () => media)
  controller.setOptions({ paused: false, soundEnabled: true })
  await Promise.resolve()
  await Promise.resolve()
  vi.advanceTimersByTime(2000)
  expect(media.play).toHaveBeenCalledTimes(1)
  controller.retry()
  expect(media.play).toHaveBeenCalledTimes(2)
  expect(media.currentTime).toBe(2)
  controller.dispose()
  media.dispatchEvent(new Event('ended'))
  expect(ended).not.toHaveBeenCalled()
  expect(media.src).toBe('')
  expect(vi.getTimerCount()).toBe(0)
})
it('a broken media file falls back to caption expiry and removes all media listeners on cleanup', () => {
  const media = new Media(),
    ended = vi.fn()
  const remove = vi.spyOn(media, 'removeEventListener')
  const controller = createDialoguePlayback(line, ended, vi.fn(), () => media)
  controller.setOptions({ paused: false, soundEnabled: true })
  media.dispatchEvent(new Event('error'))
  vi.advanceTimersByTime(6000)
  expect(ended).toHaveBeenCalledOnce()
  expect(remove).toHaveBeenCalledTimes(8)
  media.dispatchEvent(new Event('loadedmetadata'))
  expect(vi.getTimerCount()).toBe(0)
})
it('late play promise completion cannot pause a newer resume on the same media element', async () => {
  const media = new Media()
  let resolveFirst = () => {}
  media.play.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        resolveFirst = resolve
      }),
  )
  const controller = createDialoguePlayback(line, vi.fn(), vi.fn(), () => media)
  controller.setOptions({ paused: false, soundEnabled: true })
  controller.setOptions({ paused: true, soundEnabled: true })
  controller.setOptions({ paused: false, soundEnabled: true })
  const pauses = media.pause.mock.calls.length
  resolveFirst()
  await Promise.resolve()
  expect(media.pause).toHaveBeenCalledTimes(pauses)
  controller.dispose()
})

it('advances short cues on the shared clock and freezes them while paused', () => {
  const caption = vi.fn()
  const controller = createDialoguePlayback(
    {
      ...line,
      caption: 'First phrase. Second phrase.',
      captionPhrases: ['First phrase.', 'Second phrase.'],
    },
    vi.fn(),
    vi.fn(),
    () => new Media(),
    caption,
  )
  controller.setOptions({ paused: false, soundEnabled: false })
  expect(caption).toHaveBeenLastCalledWith('First phrase.')
  vi.advanceTimersByTime(1000)
  controller.setOptions({ paused: true, soundEnabled: false })
  vi.advanceTimersByTime(20000)
  expect(caption).toHaveBeenCalledTimes(1)
  controller.setOptions({ paused: false, soundEnabled: false })
  vi.advanceTimersByTime(2000)
  expect(caption).toHaveBeenLastCalledWith('Second phrase.')
  controller.dispose()
  expect(vi.getTimerCount()).toBe(0)
})

it('follows actual media position and metadata scaling, then continues cues when muted', () => {
  const media = new Media()
  const caption = vi.fn()
  const controller = createDialoguePlayback(
    {
      ...line,
      caption: 'One. Two. Three.',
      captionPhrases: ['One.', 'Two.', 'Three.'],
    },
    vi.fn(),
    vi.fn(),
    () => media,
    caption,
  )
  controller.setOptions({ paused: false, soundEnabled: true })
  media.dispatchEvent(new Event('loadedmetadata'))
  media.dispatchEvent(new Event('playing'))
  media.currentTime = 4
  media.dispatchEvent(new Event('timeupdate'))
  expect(caption).toHaveBeenLastCalledWith('Two.')
  media.currentTime = 1
  media.dispatchEvent(new Event('seeked'))
  expect(caption).toHaveBeenLastCalledWith('One.')
  controller.setOptions({ paused: false, soundEnabled: false })
  vi.advanceTimersByTime(3000)
  expect(caption).toHaveBeenLastCalledWith('Two.')
  controller.dispose()
  expect(vi.getTimerCount()).toBe(0)
})
