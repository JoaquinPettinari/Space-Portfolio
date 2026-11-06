export type MissionId =
  'tablet' | 'crew' | 'diagnostics' | 'archives' | 'dossier' | 'uplink'

export const missions: { id: MissionId; title: string; action: string }[] = [
  {
    id: 'tablet',
    title: 'Open mission tablet',
    action: 'Press T to open your personal mission tablet.',
  },
  {
    id: 'crew',
    title: 'Activate crew hologram',
    action:
      'Central projection table → Aim at the table and press E. View the crew profile from a comfortable distance.',
  },
  {
    id: 'diagnostics',
    title: 'Run ship diagnostics',
    action: 'Terminal → Experience · Inspect the engineering service log.',
  },
  {
    id: 'archives',
    title: 'Recover mission archives',
    action: 'Terminal → Projects · Open a recovered project archive.',
  },
  {
    id: 'dossier',
    title: 'Download crew dossier',
    action:
      'Rear airlock → Crew dossier panel · Aim and press E to download the CV / PDF. A copy is also available at the terminal.',
  },
  {
    id: 'uplink',
    title: 'Prepare Earth transmission',
    action:
      'Terminal → Contact · Open an email draft. Sending happens in your email app.',
  },
]

export function completeMission(
  completed: MissionId[],
  id: MissionId,
): MissionId[] {
  return completed.includes(id) ? completed : [...completed, id]
}
