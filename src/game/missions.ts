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
    title: 'Verify crew identity',
    action:
      'Entry airlock → Aim at the Crew Access terminal beside the entrance and press E once. Your full record remains available in the Central Archive.',
  },
  {
    id: 'archives',
    title: 'Review expedition archives',
    action:
      'Forward port Central Archive → Open a project or review Service Record. Professional information is always available.',
  },
  {
    id: 'uplink',
    title: 'Contact Mission Control',
    action:
      'Forward starboard Earth Communications → Send a real message or choose Skip to log a fictional status report without sending email.',
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
