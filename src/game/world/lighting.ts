/** One gentle dip over 0.9 seconds, then steady power; never a rapid strobe. */
export function restorationIntensity(elapsed: number, reducedMotion: boolean) {
  if (reducedMotion || elapsed >= 0.9) return 1
  const progress = Math.max(0, elapsed) / 0.9
  return 1 - 0.25 * Math.sin(progress * Math.PI) ** 2
}
