/** Original procedural instrumentals; these are not recordings from the NCS catalogue. */
export const RADIO_TRACKS = [
  {
    title: 'Southern Orbit',
    bpm: 78,
    roots: [45, 41, 48, 43],
    melody: [0, 7, 12, 10, 7, 3, 5, 7],
  },
  {
    title: 'Night Watch',
    bpm: 86,
    roots: [38, 43, 41, 45],
    melody: [0, 3, 7, 12, 10, 7, 5, 3],
  },
] as const

export function radioNotes(track: number, step: number) {
  const song = RADIO_TRACKS[track % RADIO_TRACKS.length]
  const root = song.roots[Math.floor(step / 16) % song.roots.length]
  const notes = [
    {
      midi: root + 24 + song.melody[step % 8],
      seconds: 0.35,
      volume: 0.09,
      type: 'sine' as OscillatorType,
    },
  ]
  if (step % 4 === 0)
    notes.push({ midi: root, seconds: 0.65, volume: 0.14, type: 'sine' })
  if (step % 16 === 0) {
    for (const offset of [12, 15, 19])
      notes.push({
        midi: root + offset,
        seconds: 1.8,
        volume: 0.025,
        type: 'triangle',
      })
  }
  return notes
}

/** Schedules a bounded 200ms lookahead, independent of rendering and React. */
export function createRadioMusic() {
  const context = new AudioContext()
  const master = context.createGain()
  master.gain.value = 0.35
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  master.connect(filter).connect(context.destination)
  const voices = new Set<OscillatorNode>()
  let track = 0,
    step = 0,
    nextTime = context.currentTime + 0.04
  const schedule = () => {
    if (context.state !== 'running') return
    if (nextTime < context.currentTime) nextTime = context.currentTime + 0.04
    while (nextTime < context.currentTime + 0.2) {
      for (const note of radioNotes(track, step)) {
        const oscillator = context.createOscillator()
        const envelope = context.createGain()
        oscillator.type = note.type
        oscillator.frequency.value = 440 * 2 ** ((note.midi - 69) / 12)
        envelope.gain.setValueAtTime(0, nextTime)
        envelope.gain.linearRampToValueAtTime(note.volume, nextTime + 0.025)
        envelope.gain.exponentialRampToValueAtTime(
          0.001,
          nextTime + note.seconds,
        )
        oscillator.connect(envelope).connect(master)
        voices.add(oscillator)
        oscillator.onended = () => {
          voices.delete(oscillator)
          oscillator.disconnect()
          envelope.disconnect()
        }
        oscillator.start(nextTime)
        oscillator.stop(nextTime + note.seconds + 0.02)
      }
      nextTime += 60 / RADIO_TRACKS[track].bpm / 2
      step = (step + 1) % 64
    }
  }
  const timer = window.setInterval(schedule, 100)
  return {
    context,
    resume: () => context.resume().then(schedule),
    suspend: () => context.suspend(),
    setVolume(value: number) {
      master.gain.setTargetAtTime(
        Math.max(0, Math.min(1, value)),
        context.currentTime,
        0.03,
      )
    },
    setTrack(value: number) {
      for (const voice of voices) voice.stop()
      track =
        ((value % RADIO_TRACKS.length) + RADIO_TRACKS.length) %
        RADIO_TRACKS.length
      step = 0
      nextTime = context.currentTime + 0.04
    },
    dispose() {
      window.clearInterval(timer)
      for (const voice of voices) voice.stop()
      master.disconnect()
      filter.disconnect()
      void context.close().catch(() => {})
    },
  }
}
