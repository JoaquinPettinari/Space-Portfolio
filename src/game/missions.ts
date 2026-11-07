export type ObjectiveId =
  'lighting' | 'tablet' | 'crew' | 'archives' | 'uplink' | 'dossier'
// The existing computer reports its Experience tab as diagnostics.
export type MissionId = ObjectiveId | 'diagnostics'

export const missions: { id: ObjectiveId; title: string; action: string }[] = [
  {
    id: 'lighting',
    title: 'Restore interior lighting',
    action: 'Airlock → Aim at the auxiliary light switch and press E.',
  },
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
    id: 'archives',
    title: 'Review expedition archives',
    action:
      'Main computer → Open a project or review Service Record. Professional information is always available.',
  },
  {
    id: 'uplink',
    title: 'Contact Mission Control',
    action:
      'Port-side Earth Communications → Send a real message or choose Skip to log a fictional status report without sending email.',
  },
  {
    id: 'dossier',
    title: 'Download crew dossier',
    action:
      'Rear starboard → Personal Workstation · Press E, then open Crew Dossier.pdf or choose Skip dossier. The wall panel and Central Archive also offer the real CV.',
  },
]

export function completeMission(
  completed: ObjectiveId[],
  id: MissionId,
): ObjectiveId[] {
  // A mailto click is not evidence of a successful transmission.
  if (id === 'uplink') return completed
  const objective = id === 'diagnostics' ? 'archives' : id
  return completed.includes(objective) ? completed : [...completed, objective]
}
