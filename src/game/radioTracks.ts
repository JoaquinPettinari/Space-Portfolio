type RadioTrack = {
  id: string
  title: string
  artists: string
  file: string
  source: string
  watch: string
}

function ncsTrack(track: RadioTrack) {
  return {
    ...track,
    credit: `Song: ${track.artists} - ${track.title} [NCS Release]\nMusic provided by NoCopyrightSounds\nFree Download/Stream: ${track.source}\nWatch: ${track.watch}`,
  }
}

/** User-provided recordings, matched to each release's official credit block.
 * File names stay intact; featured performers belong to the complete title. */
export const RADIO_TRACKS = [
  ncsTrack({
    id: 'flutter',
    title: 'Flutter',
    artists: 'Diamond Eyes',
    file: 'Diamond Eyes - Flutter [NCS Release].mp3',
    source: 'https://ncs.io/Flutter',
    watch: 'https://youtu.be/lEHM9HZf0IA',
  }),
  ncsTrack({
    id: 'worship',
    title: 'Worship',
    artists: 'Diamond Eyes',
    file: 'Diamond Eyes - Worship [NCS Release].mp3',
    source: 'https://ncs.io/Worship',
    watch: 'https://ncs.lnk.to/WorshipAT/youtube',
  }),
  ncsTrack({
    id: 'stronger',
    title: 'Stronger (feat. Jessica Reynoso)',
    artists: 'Lemon Fight',
    file: 'Lemon Fight, Jessica Reynoso - Stronger (feat. Jessica Reynoso) [NCS Release].mp3',
    source: 'https://ncs.io/LFstronger',
    watch: 'https://ncs.lnk.to/LFstrongerAT/youtube',
  }),
  ncsTrack({
    id: 'royalty',
    title: 'Royalty',
    artists: 'Egzod, Maestro Chives, Neoni',
    file: 'Maestro Chives, Egzod, Neoni - Royalty [NCS Release].mp3',
    source: 'https://ncs.io/Royalty',
    watch: 'https://ncs.lnk.to/RoyaltyAT/youtube',
  }),
  ncsTrack({
    id: 'superhero',
    title: 'Superhero (feat. Chris Linton)',
    artists: 'Unknown Brain',
    file: 'Unknown Brain, Chris Linton - Superhero (feat. Chris Linton) [NCS Release].mp3',
    source: 'https://ncs.io/superhero',
    watch: 'https://youtu.be/LHvYrn3FAgI',
  }),
] as const
