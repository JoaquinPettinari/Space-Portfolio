import {
  TERMINAL_SCREENS,
  SCREEN_POSITION,
  COMMUNICATIONS_POSITION,
  PERSONAL_POSITION,
  CREW_ACCESS_POSITION,
  COFFEE_POSITION,
  TABLE_POSITION,
} from '../interaction/station'
import { PLAYER_SPAWN_POSITION } from '../player/jump'
import { BRIDGE_OUTLINE, BOW_EDGES, CONSOLE_PATH } from '../world/bridgeLayout'
import type { ObjectiveId } from '../missions'
import {
  ARRIVAL_DEPTH,
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_PLAN_SCALE,
  arrivalSurface,
} from '../world/arrivalRoomLayout'
import { ENTRY_DOCKING_DEPTH } from '../world/entryLayout'
import {
  BRIDGE_OFFSET_Z,
  TRANSITION_START,
  TRANSITION_END,
} from '../world/bridgePlacement'

const arrivalOutline: [number, number][] = [
  [4.2, ARRIVAL_ORIGIN_Z],
  [4.2, ENTRY_DOCKING_DEPTH],
  ...Array.from({ length: 13 }, (_, i): [number, number] => {
    const depth = ARRIVAL_DEPTH * (1 - i / 12)
    return [
      arrivalSurface(-2.8, 0, depth / ARRIVAL_PLAN_SCALE)[0] *
        ARRIVAL_PLAN_SCALE,
      ARRIVAL_ORIGIN_Z + depth,
    ]
  }),
]

const locations: Record<ObjectiveId, readonly [number, number]> = {
  lighting: [0, 14.2],
  tablet: [PLAYER_SPAWN_POSITION[0], PLAYER_SPAWN_POSITION[2]],
  crew: [CREW_ACCESS_POSITION[0], CREW_ACCESS_POSITION[2]],
  archives: [SCREEN_POSITION[0], SCREEN_POSITION[2]],
  uplink: [COMMUNICATIONS_POSITION[0], COMMUNICATIONS_POSITION[2]],
  dossier: [PERSONAL_POSITION[0], PERSONAL_POSITION[2]],
}
const scale = 18
const x = (v: number) => 200 + v * scale,
  z = (v: number) => 170 + v * scale
const path = (points: readonly (readonly [number, number])[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])} ${z(p[1])}`).join(' ')
const bridgePath = (points: readonly (readonly [number, number])[]) =>
  path(points.map(([x, z]) => [x, z + BRIDGE_OFFSET_Z]))
/** Geometric map follows the same metre coordinates as the physical deck. */
export function DeckMap({ selected }: { selected: ObjectiveId }) {
  const point = locations[selected]
  return (
    <svg
      viewBox="0 0 400 550"
      role="img"
      aria-label="CRUZ DEL SUR current deck map: faceted bridge, glass passage, Crew Access in the docking arrival room, docking hatch and PAMPA-07 arrival."
    >
      <path
        d={bridgePath(BRIDGE_OUTLINE) + ' Z'}
        fill="#102c3b"
        stroke="#6dabbf"
        strokeWidth="3"
      />
      <rect
        x={x(-1.4)}
        y={z(5.1)}
        width={2.8 * scale}
        height={6.1 * scale}
        fill="#102c3b"
        stroke="#9ce8ff"
      />
      <path d={path(arrivalOutline) + ' Z'} fill="#102c3b" stroke="#6dabbf" />
      <rect
        x={x(-1.5)}
        y={z(TRANSITION_START)}
        width={3 * scale}
        height={(TRANSITION_END - TRANSITION_START) * scale}
        fill="#26343c"
        stroke="#6dabbf"
      />
      {BOW_EDGES.map((edge, i) => (
        <path key={i} d={bridgePath(edge)} stroke="#9ce8ff" strokeWidth="5" />
      ))}
      <path
        d={bridgePath(CONSOLE_PATH)}
        fill="none"
        stroke="#3eacc4"
        strokeWidth={1.05 * scale}
      />
      <rect
        x={x(TABLE_POSITION[0] - 1.05)}
        y={z(TABLE_POSITION[2] - 1.35)}
        width={2.1 * scale}
        height={2.7 * scale}
        rx="8"
        fill="#234554"
        stroke="#8bb0c2"
      />
      {(['computer', 'communications'] as const).map((kind) => {
        const { position: p, rotation } = TERMINAL_SCREENS[kind]
        return (
          <rect
            key={kind}
            transform={`rotate(${(-rotation * 180) / Math.PI} ${x(p[0])} ${z(p[2])})`}
            x={x(p[0] - 0.9)}
            y={z(p[2])}
            width={1.8 * scale}
            height="5"
            fill="#b4e9f4"
          />
        )
      })}
      <rect
        x={x(PERSONAL_POSITION[0] - 0.55)}
        y={z(PERSONAL_POSITION[2] - 0.9)}
        width={0.8 * scale}
        height={1.8 * scale}
        fill="#3eacc4"
      />
      <rect
        x={x(COFFEE_POSITION[0] - 0.6)}
        y={z(COFFEE_POSITION[2] - 0.4)}
        width={1.2 * scale}
        height={0.8 * scale}
        fill="#ffd384"
      />
      <rect
        x={x(CREW_ACCESS_POSITION[0] - 0.65)}
        y={z(CREW_ACCESS_POSITION[2])}
        width={1.3 * scale}
        height="6"
        fill="#73d5ac"
      />
      <path
        d={path([
          [-1.34, 11.65],
          [1.34, 11.65],
        ])}
        stroke="#73d5ac"
        strokeWidth="5"
      />
      <path
        d={path([
          [-1.2, ENTRY_DOCKING_DEPTH],
          [1.2, ENTRY_DOCKING_DEPTH],
        ])}
        stroke="#b4e9f4"
        strokeWidth="5"
      />
      <circle
        cx={x(point[0])}
        cy={z(point[1])}
        r="18"
        fill="none"
        stroke="#8ff4ff"
        strokeWidth="3"
        strokeDasharray="4 5"
      />
      <g fill="#d8eff6" fontSize="13" textAnchor="middle">
        <text x={x(-2.4)} y={z(-4.9 + BRIDGE_OFFSET_Z)}>
          ARCHIVE
        </text>
        <text x={x(2.4)} y={z(-2.8 + BRIDGE_OFFSET_Z)}>
          COMMS
        </text>
        <text x={x(0)} y={z(0.5)}>
          TABLE
        </text>
        <text x={x(-3.8)} y={z(4.6)}>
          COFFEE
        </text>
        <text x={x(3.4)} y={z(4.6)}>
          PERSONAL
        </text>
        <text x="200" y={z(8.2)}>
          PASSAGE
        </text>
        <text x="200" y={z(13.7)}>
          ARRIVAL
        </text>
        <text
          x={x(CREW_ACCESS_POSITION[0] + 1.1)}
          y={z(CREW_ACCESS_POSITION[2] + 0.4)}
        >
          CREW
        </text>
        <text x="200" y={z(ENTRY_DOCKING_DEPTH + 1.2)}>
          PAMPA-07
        </text>
        <text x="200" y="12">
          BOW
        </text>
      </g>
    </svg>
  )
}
