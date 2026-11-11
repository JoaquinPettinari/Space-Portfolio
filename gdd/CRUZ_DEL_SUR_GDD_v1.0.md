# CRUZ DEL SUR — Game Design Document v1.0

**Status:** Implementation-ready functional baseline; visual direction remains iterative.  
**Station:** CRUZ DEL SUR / CDS-01 / ARG-01  
**Expedition shuttle:** PAMPA-07  
**Language:** English UI, narration and subtitles. Contact accepts Spanish, English, Italian and Norwegian.

## Approved arrival revision — 2026-11-10

The latest owner brief removes the dedicated light room and mandatory switch. Sequence: PAMPA-07 docking collar through an already open hatch → single receiving room → credential-secured sliding bulkhead with adjacent Crew Access → short framed panoramic passage → main bridge reveal. Power is online from session start; the existing lighting objective records automatic arrival systems readiness, not an interaction. Crew verification alone authorizes automatic opening. Quick Portfolio Access remains available before identification. Reload resets credentials and bulkhead, never arrival power. This supersedes the historical power-gated descriptions below.

Receiving room: approximately 5.4 × 4.03 m usable behind the door pockets, 3.0 m central ceiling with chamfered shoulders; rear hatch Z=16.2, spawn Z=17.1, Crew screen unchanged at [2,1.68,12.515]. Secured bulkhead Z=11.65, panoramic passage Z=11.2…5.1, length6.1 m (~2.03 s at3 m/s). Original two-leaf GLB, sweep pockets and kinematic collider synchronization retained. Passage adds angled ribs, gaskets, segmented floor and exterior hull stringers. Compact bridge and console layout remain unchanged. Visual review is manual.

## Approved direction update — 2026-11-07

### Latest architecture and interaction brief

The owner now handles React presentation, spacing, typography, HUD/tablet/computer styling. Engineering work preserves those interfaces and focuses on architecture and 3D behavior. The approved sequence is behavior-preserving refactor, fresh session state (no gameplay persistence), one auxiliary switch inside the airlock, Crew Access on the former interior-switch side of the entry, two-leaf sliding bulkhead, and timed event-driven subtitles. Keep T/R tablet modes. Consolidate normal Quick Portfolio Access in the tablet while preserving a no-WebGL/error HTML fallback. No new tactical features, minigames, assets or general visual redesign. Older persistence/instant-door descriptions below are historical and superseded. Implementation gates are recorded in `../docs/core-interaction-progress.md`.

The owner has now approved the detailed bridge plan and authorized phase4 geometry. Its earlier approval-pending statements are historical. Implement the faceted bow, continuous two-station console, central table, rear service stations and industrial ceiling while preserving all existing interactions. Crew Access remains in the airlock. Tactical-table behavior is still a separate phase5 feature. See `../docs/phase-4-bridge.md` for implementation and validation evidence.

The owner's latest direction supersedes the earlier layout descriptions below: industrial retrofuturistic bridge, graphite structure/off-white panels, amber practical lights and restrained cyan accents, faceted panoramic bow and a continuous forward console (Central Archive left, Earth Communications right). Preserve FPS circulation and exterior views. Detailed layout is a proposal in `../docs/bridge-layout-proposal.md`, not an approved hull rebuild.

First prototype the Central Archive as a physical monitor using the existing React content aligned to its screen; retain camera return, Pointer Lock and an accessible HTML alternative. During gameplay Quick Portfolio Access focuses this same Archive; the direct HTML route remains available independently of WebGL. Communications and Personal migrate only after review of the Archive prototype.

Later, move single-E crew identification/card animation to a dedicated wall terminal beside the entry; repurpose the table as optional Tactical Hologram (rotating station model, status, docking, systems and logs). Preserve existing crew progress while migrating. Reserve opposed entry-side walls for Crew Memories and technical/gravity controls. These are separate future changes, not prerequisites for professional information.

For this iteration the user reviews visuals manually: do not automatically generate screenshots or videos, overriding the older capture-based review checklist below. The owner subsequently supplied the approved concept image `codex-clipboard-8f1ea07c-5dd8-40d2-bce0-680a4274b4f9.png`: centered tactical table, continuous forward console, Archive left, Communications right, coffee left and Personal Workstation on the right sidewall. Follow that visual target closely while validating actual dimensions/collisions separately. Its Spanish labels and TAB hint do not override the English UI and T tablet binding; PAMPA-07 remains the shuttle, not the station name. Full hull reconstruction still requires layout approval.

## 1. Vision

### Functional phase update

The owner has authorized the subsequent physical-computer, handheld-tablet and Crew Access phases. Communications and Personal reuse the physical screen architecture. T now raises/lowers a handheld tablet while walking; R explicitly focuses its native HTML controls, pausing movement and releasing the cursor. R/Walk with tablet returns to held mode; Escape pauses. This replaces the old T-only modal behavior without introducing a virtual cursor.

Crew identification moves from the table to a dedicated entry-airlock wall terminal. One E starts a short terminal-aligned card gesture and shows the existing factual identity and Master's degree on one physical screen. Preserve the persisted `crew` objective. The table no longer authenticates; tactical content is a later optional feature. The latest placement request puts both coffee and Personal near the rear in the proposed new bridge. Stop before rebuilding geometry until the coordinate/collider plan is reviewed. References to earlier table identification below describe the superseded baseline.

A polished, accessible first-person 3D portfolio set inside an Argentine-inspired research space station. A short optional recovery protocol introduces the visitor to the developer's real work. The world must be fun to explore but never obstruct professional information.

## 2. Non-negotiable principles

- The player is free to explore after the lighting interaction; objectives guide, never physically gate professional content.
- The Central Archive and quick-access portfolio provide immediate access to real projects, experience, education, CV and contact.
- Every mandatory narrative action reveals something about the person or teaches a useful interaction. No mandatory minigames.
- Never require a real email to complete the protocol. Skip is a first-class option.
- Preserve existing working gameplay and assets; inspect before refactoring.
- English-only game interface for now. The contact terminal explicitly welcomes messages in Spanish, English, Italian and Norwegian.
- The existing repository is the source of truth for actual professional information. Do not invent employers, credentials, outcomes or project details.

## 3. Setting and narrative

CRUZ DEL SUR is a fictional Argentine deep-space research station. An expedition shuttle, PAMPA-07, docks after the station has entered emergency mode. The player, an engineer, arrives to restore basic operation, authenticate, inspect expedition records, establish an Earth uplink and retrieve a personnel dossier. The cause of the interruption can be hinted at as a subtle optional mystery; no lore-heavy detours in the first release. Argentine identity appears through insignia, flag, southern-cross iconography and tasteful personal objects. This is fiction inspired by Argentine aerospace achievements, not a claim that a real Argentine crewed station exists.

## 4. Player experience and mission state

### 00 — Arrival (required future animation; direct station entry for now)

The initial arrival animation remains a required future part of the experience, as clarified by the owner. Do not replace it with a title screen asking visitors to choose between the station and a quick portfolio. Until the animation is implemented, start automatically inside near the airlock. After restoring lighting, use HUD guidance to explain that visitors can skip the tutorial and go directly to the main computer. Secondary access paths can be evaluated later; retain the DOM fallback for accessibility. No final exterior cinematic or complex assets in this phase.

### 01 — Restore Lighting

Start in safe low-light emergency mode with a clearly highlighted switch by the entrance. Voice/subtitle: “Welcome aboard CRUZ DEL SUR. Interior lighting is offline. Activate the auxiliary switch beside the airlock.” Press E; lights turn on, briefly flicker and stabilize. Immediately unlock free exploration and display current objective HUD. Do not use darkness to prevent access or make navigation unsafe.

### 02 — Open Mission Tablet

Prompt: “Press T to open your mission tablet.” The tablet shows one current objective, completed steps, destination hint and optional mission log. On first open show: “Mission guidance is optional. Explore at your own pace. For professional information, visit the Central Archive at any time.” Actions: Continue Protocol / Skip Tutorial. Skip dismisses onboarding guidance and leaves all interactions available. Support returning to guided protocol or replaying it from a settings/menu entry. Persist preferences and completion locally with versioned state and safe migration/reset behavior.

### 03 — Verify Crew Identity

Interact with the existing holographic table by pressing E once. No card pickup quest. Animate a gloved astronaut hand producing an ID card from a pocket and inserting/tapping it at a reader; a simple placeholder animation is acceptable in functional v1.0. Play short scanner sound and show blue holographic portrait (use the existing image until a user-approved spacesuit portrait is supplied). Show: real name, real job title, experience, location, Master's Degree only if verified in existing profile data. Keep this screen short and readable. Narration: “Identity verified. Welcome aboard, Engineer. Your personnel record is available.”

### 04 — Review Expedition Archives

Direct player to the **Central Archive**, the existing main computer repurposed as the professional hub. Tabs: Projects, Service Record (real employment history), Training (real degrees), Profile (complete summary). Use real project names prominently and optional humorous fictional expedition codenames as secondary labels. Candidate concepts: Universal Access Protocol (web accessibility), Orbital Traffic Network (airport nodes), Habitat Allocation System (university room management). Verify actual academic associations, technologies and claims from repository before displaying. The collaborative project may be a draft/coming-soon entry, never fabricated. Opening one genuine project or service record marks the narrative step complete. No forced reading timer.

### 05 — Contact Mission Control

A **separate communications terminal** in another part of the room. Explain visibly that this is a real message to the portfolio owner. Fields: name, email, message; clearly indicate “Messages welcome in English, Spanish, Italian or Norwegian.” Actions: Send Transmission / Skip. Send only counts as sent after confirmed backend success; show errors and allow retry. Skip completes the narrative step via a fictional status report and sends **no email**. Do not imply an email was delivered when skipped.

### 06 — Retrieve Crew Dossier

A **separate Personal Workstation**, possibly also the recreation computer. Retrofuturist desktop OS with icons and windows, accessible through mouse (single-click alternative), double-click, arrows and Enter, Escape to close windows. `Crew Dossier.pdf` opens or downloads the real CV. Additional icons can include Arcade, Command Terminal, Gallery and Station Settings. Opening dossier or explicitly skipping this objective finishes protocol. Narration: “Recovery protocol complete. All station facilities are available. Enjoy your stay aboard CRUZ DEL SUR.”

### Free Exploration

Always physically available after lighting, and optional interactables should not depend on completing the protocol. Post-protocol narration merely acknowledges this freedom. Never gate CV, projects, experience or contact behind mission progress.

## 5. Station layout and interaction distribution

- Entrance/airlock: light switch, tutorial starting point.
- Center: holographic crew ID table.
- Central Archive: full professional content, immediate access.
- Earth Communications: real contact form, separate terminal.
- Personal Workstation: CV and playful desktop OS; may share hardware with Recreation.
- Optional coffee machine, photos, gravity panel and environmental props.
- Maintain a compact room and short travel distances. Distinct locations should create visual discovery, not unnecessary walking. Add a subtle objective marker that fades and can be recalled from tablet.

## 6. Narrator, subtitles and guidance

The station assistant is calm, professional and occasionally dryly humorous. English voice-over only if practical and of adequate quality; English subtitles must always work even with muted audio. Never autoplay long unskippable dialogue. One prompt at a time; avoid repeated nags. Narration is triggered by events and can be muted. Include clear E/T/WASD/mouse/Escape instructions. No requirement for AI API/chatbot.

## 7. Optional world interactions

- Coffee machine: E produces a cup and small audiovisual response. Hidden `npm install coffee` command inside workstation terminal can activate it and grant a local achievement.
- Gravity switch: controlled, reversible floating-prop effect with no persistent player physics corruption.
- Photos: E to examine personal photos, rotate/zoom if feasible, Escape to put back. User-supplied photos only.
- Argentine details: flag/mission patch, Cruz del Sur constellation, mate, subtle football reference; no suggestion of official endorsement.
- Arcade: one small optional minigame, not on the critical path.
- Optional mysterious logs, clearly secondary to the professional portfolio.
  Prioritize one polished extra over several unfinished ones for first playable.

## 8. Exterior visual direction

Exterior is a major artistic priority: dramatic planet through windows, atmospheric scattering impression, textured surface/clouds, controlled day/night terminator, varied asteroids, convincing lighting, and occasional subtle space events. Preserve performance and avoid excessive shader/postprocessing complexity in the first functional build. Later asset pass: Blender/GLB station exterior and PAMPA-07 shuttle for cinematic docking. Gather references and approve an art bible before replacing existing assets. Do not generate an entire highly detailed environment with ad hoc primitives if quality would suffer.

## 9. Accessibility and recruiter fast path

Keep **Quick Portfolio Access** as a secondary pause-menu route and accessible DOM fallback independent of WebGL. It must not be an initial choice screen; the normal experience starts directly inside the station. Content must be available without Pointer Lock, mission completion or audio. Escape releases controls and exits terminals. Respect reduced motion and provide subtitle/mute controls. Desktop-first FPS is acceptable, but non-game information must remain accessible on mobile and without WebGL. Avoid trapping keyboard focus.

## 10. Engineering and quality requirements

Preferred existing stack: Vite, React, TypeScript, Three.js/R3F, Drei; use Rapier/Zustand/GSAP only when justified. Preserve working systems, build incrementally. Keep game logic testable outside rendering. Avoid per-frame React state updates, unnecessary allocations in useFrame and unbounded texture/model sizes. Document state machine and transitions. Never claim tests passed unless executed.

### Tests

- Vitest: mission progression, skip/continue/replay, persistence/version migration, interaction eligibility, keyboard mapping, contact validation, pure logic.
- React component tests: tablet, desktop keyboard navigation, terminal forms, quick-access fallback, subtitle controls.
- Playwright Chromium E2E: load, console/page errors, lights E interaction, T tablet, skip tutorial, identity, archive, contact skip, dossier, keyboard focus/Escape, quick access, persisted state; mock contact backend in tests.
- Manual/visual verification: screenshots of initial darkness, lights on, hologram, each terminal, desktop, exterior; review multiple viewport sizes.
- CI quality gates: typecheck, lint, format check, unit tests, build, relevant E2E. Never hide failing checks.

### Security and privacy

- Contact backend: server-side validation, bounded payloads, rate limiting/anti-spam, safe error messages, no secrets in client bundle, no open relay, do not log private message bodies unnecessarily, avoid HTML injection.
- Confirm successful delivery before showing success. Handle failures and retries.
- Minimize personal data collection; add appropriate privacy notice for contact and any analytics.
- Audit dependencies, use secure headers/CSP compatible with R3F, avoid unsafe dynamic code/eval and untrusted asset origins.
- Do not put debug/test hooks into production bundles.

## 11. Implementation plan for Codex

1. Audit repository and map current scene objects, terminals, mission system, tablet, portfolio content and contact backend. Propose minimal changes; obtain approval for significant refactors.
2. Establish mission state machine and optional guidance with tests. Keep existing data accessible.
3. Implement light switch, tutorial tablet and skip/replay behavior.
4. Implement single-E holographic ID interaction with placeholder animation and correct data.
5. Reorganize existing central computer into Archive tabs; reuse existing components/content.
6. Add separate Earth Communications terminal; implement and secure send/skip behavior.
7. Add Personal Workstation desktop and CV flow with keyboard/mouse accessibility.
8. Add assistant subtitles/event triggers and simple audio.
9. Add one polished optional extra (coffee recommended); document other extras as backlog.
10. Run tests, E2E, visual audit, performance baseline and security review; fix regressions.
11. Only then iterate on exterior art and Blender/GLB assets.

## 12. Definition of done — first functional v1.0

- All six narrative stages are usable or skippable; no required minigame.
- User can freely explore after turning on lights.
- Central Archive shows accurate real professional content and is accessible without the tutorial.
- Contact terminal safely sends a real message when configured and supports skip without sending.
- Personal Workstation provides the real downloadable CV.
- Tablet, subtitles, E/T/Escape and Pointer Lock work consistently.
- Quick Portfolio Access and non-WebGL content path work.
- Automated tests and production build pass, with evidence; visual screenshots reviewed.
- Security basics and failure states documented and verified.
- No claim of finished Blender/cinematic polish until assets are actually approved and integrated.

## 13. Open items for later design iteration

- Final station emblem, exterior art bible, detailed 3D props, gloved hand animations and cinematic intro.
- Approved spacesuit portrait and personal photo assets.
- Verified project names/details and collaborative project case study.
- Real CV path and contact provider configuration from current repository.
- Optional arcade mechanics, gravity implementation, hidden lore.
