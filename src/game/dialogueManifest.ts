export interface DialogueLine {
  readonly audioUrl: string | null
  readonly caption: string
  readonly captionPhrases?: readonly string[]
  readonly durationMs: number
  readonly priority: number
  readonly enabled: boolean
}
/** Verified files/durations; approved captions still require human listening review. */
export const dialogueManifest = {
  arrival: {
    captionPhrases: [
      'Welcome aboard CRUZ DEL SUR.',
      "I'm CDS-01, your onboard intelligence.",
      'For reasons we have yet to determine,',
      "we've lost communication with Mission Control.",
      'All essential systems remain operational.',
      "I'll guide you through the investigation.",
      'First, please verify your credentials at the Crew Access terminal.',
    ],
    audioUrl: '/audio/cds01/IA_dialog_welcome_access.mp3',
    durationMs: 19409,
    priority: 10,
    enabled: true,
    caption:
      "Welcome aboard CRUZ DEL SUR. I'm CDS-01, your onboard intelligence. For reasons we have yet to determine, we've lost communication with Mission Control. All essential systems remain operational. I'll guide you through the investigation. First, please verify your credentials at the Crew Access terminal.",
  },
  crewVerified: {
    // The supplied file says granted; the brief says granated. Preserve the real filename.
    audioUrl: '/audio/cds01/IA_dialog_access_granted.mp3',
    durationMs: 3318,
    priority: 30,
    enabled: true,
    caption: 'Identity confirmed. Bridge access granted.',
  },
  bridgeIntroduction: {
    captionPhrases: [
      'Welcome to the heart of CRUZ DEL SUR: the command bridge.',
      'Our latest diagnostics are available at the central tactical table.',
      "Let's find out what happened.",
    ],
    audioUrl: '/audio/cds01/IA_dialog_welcome_bridge.mp3',
    durationMs: 9796,
    priority: 20,
    enabled: true,
    caption:
      "Welcome to the heart of CRUZ DEL SUR: the command bridge. Our latest diagnostics are available at the central tactical table. Let's find out what happened.",
  },
  tacticalDiagnostics: {
    captionPhrases: [
      'The diagnostics confirm that our long-range communications relay is offline.',
      'The cause is still unclear.',
      "The Central Archive contains the vessel's recovery procedures.",
      'We should review them before attempting a repair.',
    ],
    audioUrl: '/audio/cds01/IA_dialog_table_result.mp3',
    durationMs: 12513,
    priority: 30,
    enabled: true,
    caption:
      "The diagnostics confirm that our long-range communications relay is offline. The cause is still unclear. The Central Archive contains the vessel's recovery procedures. We should review them before attempting a repair.",
  },
  recoveryProcedureFound: {
    audioUrl: '/audio/cds01/IA_dialog_confirmation_files.mp3',
    durationMs: 10998,
    priority: 30,
    enabled: false,
    caption:
      "There it is. The relay's signal alignment may have drifted during the last transmission. The recovery procedure is straightforward. Head to the starboard communications station. I'll walk you through it.",
  },
  relayRestored: {
    audioUrl: '/audio/cds01/IA_dialog_communications_restored.mp3',
    durationMs: 10266,
    priority: 30,
    enabled: false,
    caption:
      'Signal alignment confirmed. The long-range relay is back online. Our link to Mission Control is restored. The communications terminal is ready for an outgoing message.',
  },
  missionComplete: {
    audioUrl: '/audio/cds01/IA_dialog_missions_completed.mp3',
    durationMs: 12042,
    priority: 30,
    enabled: false,
    caption:
      'The inspection is complete. Our essential systems are stable, and communications with Mission Control have been restored. Thank you for your assistance. CRUZ DEL SUR is ready to continue the expedition.',
  },
  // Existing optional guidance remains text-only; no invented recording URLs.
  tabletPrompt: {
    audioUrl: null,
    durationMs: 4000,
    priority: 0,
    enabled: true,
    caption: 'Press T to open your mission tablet.',
  },
  tablet: {
    audioUrl: null,
    durationMs: 10000,
    priority: 0,
    enabled: true,
    caption:
      'Mission guidance is optional. Explore at your own pace. For professional information, visit the Central Archive at any time.',
  },
  archives: {
    audioUrl: null,
    durationMs: 5000,
    priority: 10,
    enabled: true,
    caption:
      'Expedition archive reviewed. All records remain available at the main computer.',
  },
  communications: {
    audioUrl: null,
    durationMs: 9000,
    priority: 10,
    enabled: true,
    caption:
      'Earth Communications. Messages are welcome in Spanish, English, Italian or Norwegian. Send Transmission sends a real message; Skip sends no email.',
  },
  transmissionAccepted: {
    audioUrl: null,
    durationMs: 6500,
    priority: 30,
    enabled: true,
    caption:
      'Transmission accepted. The message has been passed to the communications service.',
  },
  transmissionSkipped: {
    audioUrl: null,
    durationMs: 6500,
    priority: 30,
    enabled: true,
    caption:
      'Transmission deferred. No message was sent. You may continue the inspection.',
  },
  dossier: {
    audioUrl: null,
    durationMs: 6500,
    priority: 10,
    enabled: true,
    caption:
      'Crew dossier accessed. The expedition records remain available whenever you need them.',
  },
} as const satisfies Record<string, DialogueLine>
