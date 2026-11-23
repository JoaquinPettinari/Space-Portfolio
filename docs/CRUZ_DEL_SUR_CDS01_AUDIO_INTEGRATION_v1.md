# CRUZ DEL SUR — CDS-01 audio integration plan (v1)

**For Codex · React / TypeScript / React Three Fiber**  
**Scope:** connect the **seven already recorded** CDS-01 dialogue files to the existing gameplay events. Document, but **do not implement**, the missing seven recordings or upcoming gameplay/UI changes. Preserve gameplay and UI as they currently work unless a small integration fix is strictly needed.

> **Important distinction:** the seven filenames below are stems supplied by the owner, **not files verified in this repository**. Confirm actual filename, spelling, extension, encoding and duration before wiring them. The owner has not attached the audio files to this document.

## 1. The seven audio files already downloaded

All begin with `IA_dialog_`, with words separated by underscores. They are listed here in **narrative order**, not filesystem order. Preserve the owner's stems exactly, including `granated` (do **not** silently rename it to `granted`). Locate the actual extension (`.mp3`, `.wav`, `.ogg`, etc.). These map to the approved ElevenLabs voice script v2 (numbers 01, 02, 03, 04, 05, 09, 13).

| Story ID                 | Existing filename stem (extension unknown) | Approved script scene    | Trigger / location                                                                                                     | Integration status                                                          |
| ------------------------ | ------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `arrival`                | `IA_dialog_welcome_access`                 | **01 — Arrival**         | Arrival/docking scene is ready, after control becomes available; subtitle must still show if browser blocks audio      | Integrate now                                                               |
| `crewVerified`           | `IA_dialog_access_granated`                | **02 — Crew Access**     | Credential verification **success** callback, not merely pressing E or focusing reader                                 | Integrate now                                                               |
| `bridgeIntroduction`     | `IA_dialog_welcome_bridge`                 | **03 — Passage**         | First crossing of a point at **approximately halfway through the short panoramic passage** toward the bridge           | Integrate now if crossing trigger exists; otherwise implement a minimal one |
| `tacticalDiagnostics`    | `IA_dialog_table_result`                   | **04 — Tactical Table**  | Actual opening/inspection of the tactical diagnostics panel, **not** entering bridge                                   | Wire only when that event exists; no fake completion                        |
| `recoveryProcedureFound` | `IA_dialog_confirmation_files`             | **05 — Central Archive** | Opening the specific **Recovery Procedures** file and marking it reviewed                                              | Wire only when that file/event exists; no fake completion                   |
| `relayRestored`          | `IA_dialog_communications_restored`        | **09 — Relay**           | **Successful completion of the relay repair/alignment puzzle**; NEVER just entering Communications or opening the form | Reserve event integration until puzzle exists                               |
| `missionComplete`        | `IA_dialog_missions_completed`             | **13 — Completion**      | Mission flow complete **and** relay restoration actually confirmed                                                     | Integrate conditional completion gate; don't play early                     |

Suggested destination after discovering actual media paths:

```text
public/audio/cds01/
  IA_dialog_welcome_access.<actual extension>
  IA_dialog_access_granated.<actual extension>
  IA_dialog_welcome_bridge.<actual extension>
  IA_dialog_table_result.<actual extension>
  IA_dialog_confirmation_files.<actual extension>
  IA_dialog_communications_restored.<actual extension>
  IA_dialog_missions_completed.<actual extension>
```

Do not change filenames without asking. If files have not yet been copied into the repository, wire a typed mapping and report their exact expected location; do not fabricate playable URLs or claim they were tested.

## 2. Exact intended dialogue, for comparison with the audio

The text is the approved **recording script**, not proof that the audio precisely matches it. **Listen to / inspect the real files**; if ElevenLabs rendered different words, make captions agree with the spoken audio, flag the discrepancy, and do not change recordings automatically. Emotion cues are for voice generation only, not subtitles.

### 01 `arrival` — `IA_dialog_welcome_access`

> Welcome aboard CRUZ DEL SUR. I'm CDS-01, your onboard intelligence.
>
> For reasons we have yet to determine, we've lost communication with Mission Control. All essential systems remain operational.
>
> I'll guide you through the investigation. First, please verify your credentials at the Crew Access terminal.

**Action/result:** display first objective: **Verify crew identity**. No electricity/power-switch objective. Arrival is only once per session. If playback is autoplay-blocked, keep the subtitle readable and retry **only on a user gesture if appropriate**; do not replay the full welcome on every movement key press.

### 02 `crewVerified` — `IA_dialog_access_granated`

> Identity confirmed. Bridge access granted.

**Action/result:** authenticated → bridge bulkhead unlocks and **opens automatically**. Do not add a second E press or play redundant long `unlocking/opening/open` speeches; mechanical SFX and door animation provide feedback.

### 03 `bridgeIntroduction` — `IA_dialog_welcome_bridge`

> Welcome to the heart of CRUZ DEL SUR: the command bridge.
>
> Our latest diagnostics are available at the central tactical table. Let's find out what happened.

**Action/result:** prompt **Review tactical diagnostics**. Trigger once when heading from access to bridge and crossing a bounded halfway checkpoint. Never trigger merely from the door opening; do not retrigger while walking back and forth. If the user rushes to the table while the line is still playing, let the higher-priority diagnostics event supersede it cleanly.

### 04 `tacticalDiagnostics` — `IA_dialog_table_result`

> The diagnostics confirm that our long-range communications relay is offline. The cause is still unclear.
>
> The Central Archive contains the vessel's recovery procedures. We should review them before attempting a repair.

**Action/result:** reveal **comms relay OFFLINE / cause unknown**, then set next objective **Review recovery procedures at Central Archive**. The proposed Tactical Table interactions may not exist yet. Never trigger on simple proximity, generic bridge entry or the decorative hologram animation.

### 05 `recoveryProcedureFound` — `IA_dialog_confirmation_files`

> There it is. The relay's signal alignment may have drifted during the last transmission.
>
> The recovery procedure is straightforward. Head to the starboard communications station. I'll walk you through it.

**Action/result:** review the specifically named recovery instruction file; then enable/guide **Repair the communications relay**. Do **not** count opening someone's portfolio project or Service Record as finding the recovery procedure. Existing professional data must remain accessible without this task.

### 09 `relayRestored` — `IA_dialog_communications_restored`

> Signal alignment confirmed. The long-range relay is back online.
>
> Our link to Mission Control is restored. The communications terminal is ready for an outgoing message.

**Action/result:** only after the actual physical relay/radio frequency alignment puzzle is solved. This is an **in-universe fictional connection state**, separate from real internet/API availability. Only then should the Communications UI reveal/enable the real optional message form. Do not play this line on `Skip`, `Send`, an HTTP success, or a simple click on a decorative radio.

### 13 `missionComplete` — `IA_dialog_missions_completed`

> The inspection is complete. Our essential systems are stable, and communications with Mission Control have been restored.
>
> Thank you for your assistance. CRUZ DEL SUR is ready to continue the expedition.

**Action/result:** once, after the relevant story objectives have been completed and `relayRestored === true`. Since this recorded line explicitly asserts restored communication, **never play it when restoration was skipped / never built**. Do not rewrite the dialogue silently: if the existing mission tracker ends early, hold this line until the new state is available.

## 3. Missing recordings — proposed filenames and triggers (do not load yet)

The owner **has not downloaded scenes 06, 07, 08, 10, 11, 12, 14**. Their future names below are **suggestions**, not existing file claims. Do not assume there are audio bytes or insert broken paths. Fallback to subtitles if the corresponding feature is available, or keep scene disabled until implemented.

| Script scene                               | Suggested future stem              | Future trigger                                                                   | Proposed spoken text (original ElevenLabs script v2)                                                                                                                       |
| ------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **06 — Communications offline**            | `IA_dialog_communications_offline` | Open Communications **before** repairing relay; show OFFLINE UI, not form        | “The communications terminal is responding, but the outbound link is still offline. We need to recalibrate the physical relay controls before we can send a transmission.” |
| **07 — Physical radio puzzle starts**      | `IA_dialog_relay_start`            | Activate external radio/relay device or launch its alignment interface           | “Adjust the frequency controls until the two signal patterns align. Take your time.”                                                                                       |
| **08 — Incorrect alignment, optional**     | `IA_dialog_relay_retry`            | Failed attempt; **cooldown**, not every knob tick                                | “Not quite. The signal is still drifting. Try another adjustment.”                                                                                                         |
| **10 — Real contact accepted**             | `IA_dialog_transmission_accepted`  | Backend `/api/contact` returns a genuine accepted response                       | “Transmission accepted. The message has been passed to the communications service.”                                                                                        |
| **11 — Skip real message**                 | `IA_dialog_transmission_skipped`   | Click **Skip** in message form; **no API call**                                  | “Transmission deferred. No message was sent. You may continue the inspection.”                                                                                             |
| **12 — Crew dossier**                      | `IA_dialog_crew_dossier`           | Open CV / invoke dossier action (don't claim download finished if not confirmed) | “Crew dossier accessed. The expedition records remain available whenever you need them.”                                                                                   |
| **14 — Direct portfolio access, optional** | `IA_dialog_portfolio_access`       | Use Quick Portfolio Access to focus existing Central Archive                     | “Of course. The Central Archive is available whenever you're ready.”                                                                                                       |

Optional scripts are not yet a request to implement their UI, puzzles or audio generation. When actual filenames arrive, update the audio manifest and verify the exact words and lengths.

## 4. Narrative order and gameplay gates

```text
PAMPA-07 docking / arrival
  → [01 welcome_access]   Verify Crew Access
  → Crew Access successful
  → [02 access_granated]  Bulkhead auto-opens
  → cross midpoint of SHORT panoramic passage
  → [03 welcome_bridge]  Proceed to central tactical table
  → inspect actual tactical diagnostics
  → [04 table_result]    Look for recovery instructions
  → open Recovery Procedures in Central Archive
  → [05 confirmation_files]  Go to relay/communications
  → open Communications while offline
  → [06 planned]         Show offline state, no message form
  → interact with PHYSICAL radio / signal alignment unit
  → [07 planned]         One simple alignment task
     ↳ failed attempt → [08 optional planned, throttled]
  → signal actually aligned
  → [09 communications_restored] Enable contact form
  → optional real Send [10 planned] OR Skip [11 planned]
  → optional crew dossier [12 planned]
  → eligible story completion
  → [13 missions_completed]   only if relay really restored
  ↳ Quick Portfolio Access [14 optional planned] is never gated
```

**Note:** the screenshot's current four objectives (`crew`, `archives`, `uplink`, `dossier`) are an older model. The tactical diagnosis, recovery file and physical relay mini-task are **planned new gameplay**, and the user explicitly wants to work on computers afterward. Do not implement them just to make the audio fire. Discuss with the owner how the mission count, Skip and optional dossier affect `missionComplete` before altering mission state. In the meantime preserve working content and do not claim completion prematurely.

## 5. Integration specifics / suggested ownership

Audit the existing code before editing:

- `src/game/dialogue.ts`: dialogue IDs, text/duration, de-duplication and precedence.
- `src/game/useDialogue.ts`: queue, playback timing, pause and visibility.
- `src/game/Game.tsx`: event dispatch and event order; use existing callbacks rather than inventing a parallel state machine.
- `src/game/ui/StationAssistant.tsx`: CDS-01 label, voice indicator, subtitles and dismiss logic.
- `src/game/ui/GameHud.tsx`: visibility and overlay behavior.
- `src/game/world/CrewAccess.tsx`, `identification.ts`, `bulkhead.ts`: verification → physical door.
- Tactical Table / Archive / Communications / mission state modules: find exact current components and callbacks, do not assume planned interactions already exist.

Implement a **single typed audio manifest**, not ad hoc `new Audio(...)` scattered across components. Keep ID → actual audio URL → captions → priority together. For example (illustrative only; preserve actual confirmed extensions):

```ts
const dialogueAudio = {
  arrival: '/audio/cds01/IA_dialog_welcome_access.mp3',
  crewVerified: '/audio/cds01/IA_dialog_access_granated.mp3',
  bridgeIntroduction: '/audio/cds01/IA_dialog_welcome_bridge.mp3',
  tacticalDiagnostics: '/audio/cds01/IA_dialog_table_result.mp3',
  recoveryProcedureFound: '/audio/cds01/IA_dialog_confirmation_files.mp3',
  relayRestored: '/audio/cds01/IA_dialog_communications_restored.mp3',
  missionComplete: '/audio/cds01/IA_dialog_missions_completed.mp3',
} as const
```

`.mp3` in this **example is a placeholder**, not a claim about downloaded file formats. Do not commit these URLs until checking real files.

### Requirements

1. **One playback controller and one subtitle controller:** the current line, audio, queue and pause/skip must agree. Don't introduce separate overlapping spoken and text dialogue managers.
2. **Real audio duration:** use `loadedmetadata`/actual media length to set subtitle lifetime; allow a safe fallback for missing/broken audio. Longer lines may use several caption segments timed to speech rather than one huge subtitle.
3. **One-shot semantics:** each story ID once per game session. A new visit to a terminal does not re-narrate it. Reload resets as already intended.
4. **Priority:** mission-critical result > location introduction > ambient. A newer event may interrupt a previous one, but must stop/clean up old audio, clear its captions and avoid leaked event listeners.
5. **User audio options:** existing Sound ON/OFF controls voice playback; Subtitles ON/OFF controls text independently. Muting voice must not prevent objectives or captions; no autoplay audio until browser/user-interaction policy allows it.
6. **Pause behavior:** Escape pause, hidden tab and application suspension should pause sound **and** subtitle countdown, then resume consistently. Terminal focus should not accidentally cancel narration unless intentional.
7. **No fake triggers:** a dialogue that implies diagnostics or signal restoration must not fire when that feature isn't implemented. Give a clear list of deferred events rather than adding placeholder puzzle state.
8. **No obsolete electricity dialogue:** remove/suppress `restored` and any narration that implies a power-switch mission. No extra `unlocking`/`opening`/`open` spoken notifications competing with `crewVerified`.
9. **Subtitles:** always use English exact spoken content; omit `[calm]` etc. Keep CDS-01's compact cinematic bottom overlay; no intrusive center-screen modal or mandatory Dismiss button.
10. **Email truthfulness:** `accepted` means accepted by the message service, not delivered/read. Skip must never call the email API. An in-universe restored relay does not imply an email was sent.
11. **Performance:** preload only imminent short clips or load on demand; don't add a continuous render-loop audio check; clean up Audio objects on unmount.
12. **Scope boundaries:** do **not** redesign HUD, tablet, 3D scene, Blender files, Archive desktop, radio puzzle or contact form in this task.

## 6. Delivery in phases — to avoid half-finished features

**Stage A — Do now, if files are present:**

- Inspect current dialogue architecture and locate exact seven media files (or report missing paths).
- Integrate `arrival`, `crewVerified`, `bridgeIntroduction` with real events and captions.
- Wire `tacticalDiagnostics`, `recoveryProcedureFound`, `relayRestored`, `missionComplete` only to **actual existing** events; if their events do not exist yet, register typed IDs/config but leave them disabled.
- Remove obsolete power and redundant spoken door-phase messages from normal playback **without** breaking the physical door behavior.
- Fix pause/mute/subtitle synchronization in this specific audio path.
- Run typecheck, lint, related dialogue/mission tests and build. User will verify audio manually; no screenshots/videos needed.

**Stage B — Later, separate approved task:**

- Implement Tactical Table diagnostic reveal and objective event.
- Implement desktop-style Recovery Procedures entry in Archive, preserve real portfolio.
- Implement physical radio/relay alignment mini-puzzle and an OFFLINE Communications screen.
- On puzzle success, fire `relayRestored`, enable optional real contact form.
- Add scenes 06–08, 10–12 and 14 when recording files are supplied.
- Review five/six objective progress and narrative completion conditions with the owner first.

## 7. What Codex must report back

Provide a concise table for all **seven available recordings**: `found file path`, `verified extension/duration`, `actual trigger`, `implemented / deferred`, `reason for deferral`. List missing 06/07/08/10/11/12/14 as **unrecorded**, not as bugs. State which events are currently unavailable and which files were edited. Do not say sounds are working unless the real audio files were found and loaded.

**Stop after Stage A.** No new gameplay systems or speculative features until the next review.
