import {
  PASSAGE_CENTER,
  PASSAGE_START,
  PASSAGE_DEPTH,
  PASSAGE_PROFILE,
} from './world/passageLayout'

const passageHalfWidth = Math.max(...PASSAGE_PROFILE.map(([width]) => width))

export type PassagePosition = { x: number; y: number; z: number }
/** Forward-only segment crossing, bounded by the real short panoramic passage. */
export function crossedPassageMidpoint(
  previous: PassagePosition,
  current: PassagePosition,
) {
  const inside = (p: PassagePosition) =>
    Math.abs(p.x) <= passageHalfWidth &&
    p.y >= 0.5 &&
    p.y <= 3.1 &&
    p.z >= PASSAGE_START &&
    p.z <= PASSAGE_START + PASSAGE_DEPTH
  return (
    inside(previous) &&
    inside(current) &&
    previous.z > PASSAGE_CENTER &&
    current.z <= PASSAGE_CENTER
  )
}
