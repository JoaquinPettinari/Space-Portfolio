/** Short local scanner tone. Uses the already user-enabled ambience context. */
export function playScanner(context: AudioContext) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.connect(gain).connect(context.destination)
  const now = context.currentTime
  oscillator.frequency.setValueAtTime(720, now)
  oscillator.frequency.linearRampToValueAtTime(1240, now + 0.3)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.045, now + 0.025)
  gain.gain.linearRampToValueAtTime(0, now + 0.5)
  let released = false
  const disconnect = () => {
    if (released) return
    released = true
    oscillator.disconnect()
    gain.disconnect()
  }
  oscillator.onended = disconnect
  oscillator.start(now)
  oscillator.stop(now + 0.55)
  return () => {
    oscillator.stop()
    disconnect()
  }
}
