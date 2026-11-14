export type ObjectiveId =
  'lighting' | 'tablet' | 'crew' | 'archives' | 'uplink' | 'dossier'
// The existing computer reports its Experience tab as diagnostics.
export type MissionId = ObjectiveId | 'diagnostics'

export const missions: { id: ObjectiveId; title: string; action: string }[] = [
  {
    id: 'lighting',
    title: 'Arrival systems online',
    action:
      'Docking arrival → Power is already online. No switch interaction is required.',
  },
  {
    id: 'crew',
    title: 'Verify crew identity',
    action:
      'Arrival room → Aim at Crew Access beside the secured bulkhead and press E once. Your full record remains available in the Central Archive.',
  },
  {
    id: 'tablet',
    title: 'Open mission tablet',
    action: 'Press T to open your personal mission tablet.',
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
      'Rear starboard → Personal Workstation · Press E, then open Crew Dossier.pdf or choose Skip dossier. Central Archive also offers the real CV.',
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
