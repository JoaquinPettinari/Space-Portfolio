import { ENTRY_OFFSET } from './bridgeLayout'

type Panel = {
  name: string
  at: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  glass?: boolean
}
/** Local Z coordinates; a single receiving room precedes the secured bulkhead. */
export const ENTRY_PANELS: Panel[] = [
  { name: 'receiving-floor', at: [0, -0.1, 7.75], size: [5.6, 0.2, 5.1] },
  { name: 'receiving-roof', at: [0, 3.1, 8.1], size: [4.4, 0.2, 4.4] },
  { name: 'pocket-header', at: [0, 2.85, 5.99], size: [5.6, 0.5, 0.16] },
  { name: 'docking-header', at: [0, 2.8, 10.2], size: [5.6, 0.6, 0.2] },
  { name: 'docking-floor', at: [0, -0.1, 11.25], size: [3.2, 0.2, 1.9] },
  { name: 'docking-rear', at: [0, 1.5, 12.2], size: [3.2, 3, 0.2] },
  { name: 'docking-roof', at: [0, 3.1, 11.2], size: [3.2, 0.2, 2] },
  // The port wall is genuinely interrupted by this glazed section.
  { name: 'port-lower', at: [-2.8, 0.5, 8.1], size: [0.2, 1, 4.4] },
  { name: 'port-upper', at: [-2.8, 2.3, 8.1], size: [0.2, 0.4, 4.4] },
  { name: 'port-forward', at: [-2.8, 1.55, 6.55], size: [0.2, 1.1, 1.3] },
  { name: 'port-aft', at: [-2.8, 1.55, 9.75], size: [0.2, 1.1, 1.1] },
  {
    name: 'receiving-window',
    at: [-2.8, 1.55, 8.2],
    size: [0.1, 1.1, 2],
    glass: true,
  },
  { name: 'starboard-wall', at: [2.8, 1.25, 8.1], size: [0.2, 2.5, 4.4] },
]
for (const side of [-1, 1]) {
  ENTRY_PANELS.push(
    {
      name: `receiving-shoulder-${side}`,
      at: [side * 2.4, 2.7, 8.1],
      size: [Math.hypot(0.6, 0.6) + 0.15, 0.16, 4.4],
      rotation: [0, 0, (-side * Math.PI) / 4],
    },
    {
      name: `docking-jamb-${side}`,
      at: [side * 2, 1.25, 10.2],
      size: [1.6, 2.5, 0.2],
    },
    {
      name: `docking-side-${side}`,
      at: [side * 1.5, 1.5, 11.2],
      size: [0.2, 3, 2],
    },
  )
}
export const ENTRY_DOCKING_DEPTH = 10.2 + ENTRY_OFFSET
export const ENTRY_POWER_POSITION = [-2.7, 1.65, 7.4 + ENTRY_OFFSET] as const
// Support extends 0.30 m behind the body: its back meets the pocket face at 12.07.
// X=2.00 keeps the 1.30 m casing entirely outside the 2.68 m central opening.
export const ENTRY_CREW_POSITION = [2, 1.65, 6.37 + ENTRY_OFFSET] as const
export const ENTRY_CREW_SCREEN = [2, 1.68, 6.515 + ENTRY_OFFSET] as const
