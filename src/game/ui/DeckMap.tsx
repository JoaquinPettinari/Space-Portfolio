import {
  SCREEN_POSITION,
  COMMUNICATIONS_POSITION,
  PERSONAL_POSITION,
  CREW_ACCESS_POSITION,
} from '../interaction/station'
import type { ObjectiveId } from '../missions'

/** Current room coordinates, not the proposed bridge or the reference game's map.
 * 30 SVG units per metre; proa is up (-Z). Update locations when geometry moves. */
const locations: Record<ObjectiveId, readonly [number, number]> = {
  lighting: [-1.4, 6.1],
  tablet: [0, 7],
  crew: [CREW_ACCESS_POSITION[0], CREW_ACCESS_POSITION[2]],
  archives: [SCREEN_POSITION[0], SCREEN_POSITION[2]],
  uplink: [COMMUNICATIONS_POSITION[0], COMMUNICATIONS_POSITION[2]],
  dossier: [PERSONAL_POSITION[0], PERSONAL_POSITION[2]],
}
const x = (value: number) => 200 + value * 30
const z = (value: number) => 185 + value * 30

export function DeckMap({ selected }: { selected: ObjectiveId }) {
  const point = locations[selected]
  return (
    <svg
      viewBox="0 0 400 450"
      role="img"
      aria-label="CRUZ DEL SUR current deck map: forward port Archive, forward starboard Communications, central table, rear Personal Workstation and Crew Access in the entry airlock."
    >
      <path
        d="M80 35 H320 L350 65 V320 L335 335 H65 L50 320 V65 Z"
        fill="#102c3b"
        stroke="#6dabbf"
        strokeWidth="3"
      />
      <rect
        x={x(-1.4)}
        y={z(5)}
        width={84}
        height={93}
        fill="#102c3b"
        stroke="#6dabbf"
      />
      <path
        d="M50 65 L80 35 H320 L350 65 M50 65 V185 M350 65 V185 M50 188 V221 M350 188 V221"
        stroke="#9ce8ff"
        strokeWidth="5"
      />
      <rect x={x(-3.8)} y={z(-4.6)} width={228} height={36} fill="#3eacc4" />
      <rect
        x={x(-1.05)}
        y={z(-0.85)}
        width={63}
        height={81}
        rx="8"
        fill="#234554"
        stroke="#8bb0c2"
      />
      <rect x={x(-3.3)} y={z(-3.82)} width={54} height={5} fill="#b4e9f4" />
      <rect x={x(1.5)} y={z(-3.82)} width={54} height={5} fill="#b4e9f4" />
      <rect x={x(4)} y={z(1.2)} width={24} height={54} fill="#3eacc4" />
      <rect x={x(-4.15)} y={z(4.77)} width={54} height={4} fill="#3eacc4" />
      <rect x={x(-1.4)} y={z(5.79)} width={7} height={18.6} fill="#ffd384" />
      <rect x={x(-1.52)} y={z(6.65)} width={8} height={39} fill="#73d5ac" />
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
        <text x="128" y="109">
          ARCHIVE
        </text>
        <text x="272" y="109">
          EARTH COMMS
        </text>
        <text x="200" y="203">
          TABLE
        </text>
        <text x="104" y="315">
          CV
        </text>
        <text x="290" y="286">
          PERSONAL
        </text>
        <text x="200" y="421">
          AIRLOCK
        </text>
        <text x="200" y="20">
          BOW
        </text>
      </g>
    </svg>
  )
}
