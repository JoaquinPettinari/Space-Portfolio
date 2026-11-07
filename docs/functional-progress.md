# CRUZ DEL SUR — functional development audit

## Baseline, 7 November 2026

The latest seven-phase user brief supersedes the historical phase numbering in architecture.md and the earlier deferral of the contact backend. Preserve the direct 3D start; no initial route-choice screen.

| Phase                    | Existing implementation / next acceptance                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Missions and tablet  | Implemented: pure protocol reducer, versioned local persistence, T tablet, optional guidance/skip/replay, independent activities and lights.                           |
| 2 — Identity and archive | Implemented: single-E placeholder card scan, real portrait, shared DOM professional content, immediate CV/projects/employment/education and secondary non-WebGL route. |
| 3 — Communications       | New shared form and separate port-wall terminal, secure Vercel API. Local automated validation and external deployment validation are separate gates.                  |
| 4 — Workstation          | Implemented: separate rear-starboard desktop, real CV/download/skip, project gallery, keyboard navigation and settings help.                                           |
| 5 — Extras               | Implemented: coffee brew/drink, local discovery, safe fictional command terminal, project-image inspection and zoom. No invented personal photographs.                 |
| 6 — Airlock              | Implemented and validated: compact entry, power, permanent opening, crossings, persistence, replay and existing-room regressions.                                      |
| 7 — PAMPA-07             | User confirms GLBs are being created for a later asset pass. Use provisional geometry now; no personal photos invented.                                                |

## Reuse and boundaries

- `src/game/protocol.ts`, `useProtocol.ts`, `missions.ts`: progression, persistence, optional objectives. `transmission` records accepted/explicitly skipped outcomes; arbitrary legacy `uplink` activities still cannot claim an email was sent.
- `Interaction.tsx`: nearest-surface raycast and E, distance-limited, no progress gating. `Player.tsx` owns camera transitions and physics; `MouseLook.tsx` owns real capture/raw-input fallback.
- `PortfolioContent.tsx` shares real data in `src/data/portfolio.ts` and supplied assets with Central Archive and the accessible portfolio. No invented credentials or projects.
- `ContactForm.tsx` shares the form between that DOM route and Earth Communications. No message persistence. Only confirmed API acceptance completes a real transmission; Skip sends no request.
- `TerminalPanel.tsx` provides a DOM dialog and focus boundary; Escape is handled even when typing and always releases controls. Explicit E/close resumes capture; no global automatic recapture after Escape.
- Vitest validates pure/domain/DOM/backend behavior; Playwright validates actual browser input and Pointer Lock. No test setters or backend credentials are exposed to the browser.

## Baseline verification

Before the new communications changes, `npm run check` passed typecheck, lint, format, 51 tests and production build. The resume test now checks a bounded final interpolated step followed by stable position with W still held. All three real Pointer Lock resume scenarios passed on rerun.

Phase 3 validation: `npm run check` passed 92 tests and all other gates; `npm run test:e2e -- e2e/resume.spec.ts e2e/contact.spec.ts` passed 5/5, `npm run test:e2e:production` passed 1/1. Windows sandbox teardown initially hung; the elevated rerun exited cleanly. Screenshot `artifacts/earth-communications.png` was inspected; heading/notice remain visible and content scrolls independently. Fifteen headless scene samples: 83 draw calls, 38,134 triangles, median frame 103.9 ms on this host. This does not demonstrate 60 FPS on the user's GPU. `artifacts/contact-scene-observations.json` holds measurements.

Dependency audit: production-only audit reported zero advisories; full audit reported 10 moderate findings in development tooling through minimatch (GHSA-g3hv-75wg-m249). No forced major downgrade/override was applied. This remains a tooling maintenance item, not a clean full audit.

External email acceptance, Redis integration and Vercel provisioning require environment configuration and a separately authorized real-message test. No automated test sends actual email. See `contact.md` for configuration and operational limits.

## Phase 4 validation

`npm run check` passed typecheck/lint/format, 99 tests and build. Two real Chromium workstation scenarios passed: keyboard navigation/focus, actual PDF download, independent objective completion, explicit skip without download, child-window Escape and E resume. The five contact/resume regressions also passed. A disabled Skip button originally lost focus; focus now moves to Close window before disabling and the new unit/E2E regression passes. Desktop/gallery screenshots were inspected.

## Phase 5 validation

`npm run check` passed all gates, including 108 tests. Two extras E2E scenarios and two workstation regressions passed. The final command scenario was rerun after fixing prompt visibility and passed. Real E input preserves Pointer Lock for coffee; the hidden command activates the same dispenser. Optional progress never alters protocol completion. Photo inspection uses a genuine supplied project screenshot; a personal-photo gallery remains for approved assets. `useCoffee` clears timers on unmount, pauses brewing while the DOM portfolio suspends the scene, and tolerates unavailable local storage. Audio uses the existing opt-in context; muted visitors hear nothing. Command input is a bounded whitelist, not a shell, network client or evaluator.

## Airlock implementation

The main room is preserved except for its central rear opening. `EntryAirlock` adds static floor/walls/ceiling; the rear panel and collider are split around a 2.5 m by 3.3 m passage. The door leaf and collider are removed together after power and E. It never closes on the player. Spawn is `[0, 1, 7]`; an additional instance of the existing switch is mounted to the left. Persisted power starts with an open passage, and replay never re-closes it. The existing station controls and positional interpolation remain unchanged. E2E helpers now restore power, open the door and walk physically into the original room; they do not teleport or seed mission completion.

## Final functional regression evidence

The long 30-scenario run was interrupted after progressive headless-host degradation: 13 passed, four timed out and one exposed a duplicate email link. It was not a passing full suite. The duplicate was removed, entry-aware test budgets were adjusted without loosening physics/input assertions, and affected/remaining tests were run in fresh browser processes. Batches A–F passed 4, 4, 3, 4, 3 and 3 scenarios respectively. Combined with the retained earlier passes, all **31 unique development scenarios** have successful executions; this is not a claim of one uninterrupted full-suite pass.

The additional journey walks the actual route through all six objectives, skips contact with zero API calls, downloads the real CV and restores 6/6 completion after reload. Contact submission/skip keeps focus on its status before buttons are disabled. The Skip message describes only that action; it does not pretend to cancel a previously submitted request.

Evidence is retained locally under `artifacts/phase6-validation.txt`, batch A–F HTML reports, screenshots and the identity video (ignored by Git). Final lit-room observations contain two sets of 15 samples: 79 draw calls, 38,076 triangles; median frame 108.9/111 ms on this headless host. Camera and lighting differ from the phase 3 sample, so these are observations, not a like-for-like performance improvement or hardware FPS guarantee. Opera/hardware performance remains a manual check.

The Lua limiter now returns at least one retry second for an exceeded bucket, including Redis TTL 0. Mocked backend tests do not execute live Redis Lua; that integration remains part of external setup. Deployment security headers have a single source in `vercel.json`, reused by the local production preview. No provider credentials or real-email test were used.

## Changed modules by phase

- Phase 3: `api/contact.ts`, `server/contact.ts`, `shared/contact.ts`, `src/contact/`, `WallTerminal.tsx`, `TerminalPanel.tsx`, portfolio/Game/protocol integration, `.env.example`, environment exclusions and deployment/preview headers. Backend, DOM and communications E2E tests accompany these modules.
- Phase 4: `src/workstation/PersonalDesktop.tsx` and CSS/tests, shared station camera poses in `interaction/station.ts`/`Player.tsx`, rear terminal and tablet-map integration, workstation E2E.
- Phase 5: `coffee.ts`, `useCoffee.ts`, `CoffeeMachine.tsx`, `ProjectPhoto.tsx`, `PhotoInspection.tsx`, `CommandTerminal.tsx`, opt-in audio integration and optional-activity tests.
- Phase 6: `EntryAirlock.tsx`, `Greybox.tsx`, `ShipHull.tsx`, reusable `AuxiliarySwitch.tsx`, shared spawn in `player/jump.ts`, Game/assistant/map integration, airlock and cumulative-journey E2E, existing traversal helpers/regressions.

## Deferred assets and external setup

The owner confirmed GLBs are still being created. Current simple geometry remains intentionally provisional; no PAMPA-07 GLB was inspected or integrated, and no final arrival/exterior cinematic is claimed. Existing world components keep visuals separate from colliders and interaction rules for later replacement. Personal photographs also await approved assets; current inspection/gallery uses supplied project screenshots.

To activate real contact, configure Vercel, Resend, a verified sender and Redis using `contact.md` and `.env.example`, then perform an explicitly authorized real delivery test. Automated tests must continue to mock outgoing email. Development-tool minimatch advisories, large 3D chunk warnings and known upstream Three/Rapier deprecation warnings remain documented; production dependency audit reported no advisories at the time of this run.

## Final quality gates

After the final code changes: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test -- --maxWorkers=1` (108/108 across 22 files), and `git diff --check` passed. Tests were run serially to avoid competing with headless browser resources. `npm run test:e2e:production` rebuilt production and passed 1/1: actual canonical HTTP security headers, normal station/Pointer Lock/Quick Portfolio behavior, absent production diagnostics and real CSP denial of an injected inline script. There were no normal browser errors or CSP violations; the single intentionally blocked probe was explicitly asserted. No Vercel deployment or real provider/Redis connection is implied by these local results.
