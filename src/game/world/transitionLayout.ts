import type { StaticPanel } from './StaticPanels'

export type Clearance = {
  min: readonly [number, number, number]
  max: readonly [number, number, number]
}

/** World-space replacement volume; the wider collars do not widen the corridor. */
export const TRANSITION_CLEARANCES: readonly Clearance[] = [
  { min: [-2.11, -0.3, 2.095], max: [2.11, 3.4, 5.105] },
  { min: [-2.9, -0.3, 1.96], max: [2.9, 3.4, 2.5] },
  { min: [-2.03, -0.3, 4.87], max: [2.03, 3.4, 5.28] },
]

/** Preserve the outer flanks of the old bridge rear wall beside the new niches. */
export function trimTransitionBackPanels(
  panels: readonly StaticPanel[],
): StaticPanel[] {
  const halfWidth = TRANSITION_CLEARANCES[1].max[0]
  return panels.flatMap((panel) => {
    const min = panel.at[0] - panel.size[0] / 2
    const max = panel.at[0] + panel.size[0] / 2
    return [
      [min, Math.min(max, -halfWidth)],
      [Math.max(min, halfWidth), max],
    ]
      .filter(([start, end]) => end > start)
      .map(([start, end]) => ({
        ...panel,
        at: [(start + end) / 2, panel.at[1], panel.at[2]],
        size: [end - start, panel.size[1], panel.size[2]],
      }))
  })
}
