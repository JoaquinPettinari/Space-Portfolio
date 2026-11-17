import { readFileSync, writeFileSync } from 'node:fs'
import { format } from 'prettier'
import { RADIO_TRACKS } from '../../src/game/radioTracks.ts'

const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const page = new URL('../../public/credits.html', import.meta.url)
const start = '<!-- MUSIC_CREDITS_START -->'
const end = '<!-- MUSIC_CREDITS_END -->'
const section = `${start}\n<section id="music"><h2>Music</h2>\n${RADIO_TRACKS.map((track) => `<article><h3>${escape(track.artists)} — ${escape(track.title)}</h3><pre>${escape(track.credit)}</pre><p><a href="${escape(track.source)}">Official release</a> · <a href="${escape(track.watch)}">Watch on YouTube</a></p></article>`).join('\n')}\n</section>\n${end}`
const html = readFileSync(page, 'utf8')
if (!html.includes(start) || !html.includes(end))
  throw new Error('Music credit markers missing')
writeFileSync(
  page,
  await format(
    html.slice(0, html.indexOf(start)) +
      section +
      html.slice(html.indexOf(end) + end.length),
    { parser: 'html' },
  ),
)
writeFileSync(
  new URL('../../public/audio/radio/CREDITS.txt', import.meta.url),
  RADIO_TRACKS.map((track) => track.credit).join('\n\n') + '\n',
)
