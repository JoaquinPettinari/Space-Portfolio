import { StaticPanels, type StaticPanel } from './StaticPanels'
import { ARRIVAL_DEPTH, ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'

// Millimetres of relief on the rear pressure wall, outside the hatch opening.
// Repeated louvres and screws share instances; no lights, updates or colliders.
const rear = ARRIVAL_ORIGIN_Z + ARRIVAL_DEPTH - 0.04
// The port grille was replaced by the full-height EVA niche.
const details: StaticPanel[] = [1].flatMap((side) => {
  const x = side * 2.36
  return [
    { at: [x, 0.61, rear], size: [0.82, 0.58, 0.045], color: '#465057' },
    {
      at: [x, 0.61, rear - 0.025],
      size: [0.68, 0.43, 0.012],
      color: '#10191e',
    },
    ...Array.from({ length: 8 }, (_, i): StaticPanel => ({
      at: [x, 0.445 + i * 0.047, rear - 0.046],
      size: [0.61, 0.018, 0.035],
      color: '#465057',
    })),
    ...[-1, 1].flatMap((horizontal) =>
      [-1, 1].map((vertical): StaticPanel => ({
        at: [x + horizontal * 0.365, 0.61 + vertical * 0.24, rear - 0.026],
        size: [0.021, 0.021, 0.012],
        color: '#a3a7a6',
      })),
    ),
    {
      at: [x, 0.95, rear - 0.02],
      size: [0.29, 0.024, 0.012],
      color: '#bc9450',
    },
  ]
})

export function ArrivalServiceDetails() {
  return (
    <group name="arrival-exposed-service-grilles">
      <StaticPanels panels={details} />
    </group>
  )
}
