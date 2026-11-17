// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { expect, test } from 'vitest'
import { RADIO_TRACKS } from './radioTracks'

test('every supplied MP3 is listed once and its complete credit is published', () => {
  const files = readdirSync(
    new URL('../../public/audio/radio/', import.meta.url),
  ).filter((file) => file.endsWith('.mp3'))
  expect(RADIO_TRACKS.map((track) => track.file).sort()).toEqual(files.sort())
  expect(new Set(RADIO_TRACKS.map((track) => track.id)).size).toBe(
    RADIO_TRACKS.length,
  )
  const credits = readFileSync(
    new URL('../../public/audio/radio/CREDITS.txt', import.meta.url),
    'utf8',
  )
  const html = readFileSync(
    new URL('../../public/credits.html', import.meta.url),
    'utf8',
  )
  for (const track of RADIO_TRACKS) {
    expect(credits).toContain(track.credit)
    expect(html).toContain(track.title)
    expect(html).toContain(track.artists)
    expect(html).toContain(track.source)
    expect(html).toContain(track.watch)
  }
})
