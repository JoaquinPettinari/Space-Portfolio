# CRUZ DEL SUR — Physical stations, handheld tablet and Crew Access

Scope: latest approved incremental plan. No hull rebuild, new dependencies, final assets, automatic screenshots or videos. Phase 4 geometry requires review; Phase 5 tactical table follows later.

## Phase 1 — Physical computers

- Shared `PhysicalScreen` wraps Drei Html and requests a frame after DOM commit, preserving the Archive demand-rendering fix.
- `PhysicalTerminal` maps existing Communications and Personal content to their existing 1.1×0.8 m screens (770×560 CSS px, factor4/7). No furniture or collision changes.
- Straight-on camera poses share screen centers and adjust distance for narrow viewports. E/button returns retain the same synchronous Pointer Lock request; Escape intentionally pauses.
- Existing ContactForm/server validation, rate limits and provider acceptance semantics are unchanged. Skip sends nothing. Personal reuses CV, gallery, settings and command terminal; no mandatory game is added.
- Accessible HTML portfolio remains available from all physical screens and pause. Archive's professional records remain shared with the standalone fallback.
- Changed: `PhysicalScreen.tsx`, `PhysicalTerminal.tsx`, `ArchiveScreen.tsx`, `TerminalPanel.tsx`, `Computer.css`, `station.ts`, `Player.tsx`, `Game.tsx`, unit/E2E tests.
- Browser validation: 6/6 passed (1.4 min), including all four Archive baseline scenarios, Communications Skip/error/retry and Personal keyboard/CV. Network sends were mocked. No media recorded.
- Phase gate: typecheck, lint, format, 119 unit tests/25 files and production build passed. Unit count includes the prepared tablet and identity modules. Known large-chunk warning remains.

## Phase 2 — Handheld tablet

Input strategy: T raises/lowers a read-only held display while retaining WASD and real Pointer Lock. R explicitly focuses the native HTML tablet, releases cursor and pauses movement. R/Walk with tablet returns to held controls; Escape pauses. No virtual cursor and no simultaneous mouse UI/camera ownership. The normal HUD offers a button for unlocked keyboard/mouse users.

The camera-relative placeholder has two astronaut gloves, bounded raise/lower animation, reduced-motion support and no collision/raycast interference. The map represents the current room and airlock, not the future bridge or reference game's map.

Integrated in Game with explicit tablet mode. World E targets are disabled while held so the prop cannot accidentally activate an object behind it. Only focused mode stops movement; input/capture remain owned by Game/MouseLook. Legacy tablet tests were updated to use T then R rather than silently bypassing the new interaction.

Phase gate: dedicated real T/WASD/R/Skip/T/Escape test passed (21.9 s), including movement while held, stopped motion while focused and capture restoration. Typecheck, lint, format, 119 unit tests and production build passed again after integration. Hands are lightweight provisional gloves/wrists; final visual review remains manual.

## Phase 3 / Phase 4 boundary

Crew Access preserves the existing crew completion event and factual identity, with a terminal-local card animation and compact single-screen record. Current terminal center is `(-1.4,1.65,7.3)`, yaw PI/2 on the left entry-airlock wall. It fits behind the existing power switch without overlapping the CV or doorway. Screen center `(-1.255,1.68,7.3)`; normal focused camera `(-0.205,1.68,7.3)`, aspect-aware distance as for the other wall monitors. Frame/collider1.3×1.1×.24 locally; world .24×1.1×1.3. Reader local `(0,-.48,.155)` remains below the screen and in view. Card motion shares the reader's coordinates, not a floating camera-relative reader.

The table no longer authenticates visitors, and the old profile hologram/modal is not mounted. Tactical inspection is a separate phase after geometry-plan review; the existing table is temporarily inert. No persisted mission reset, real profile changes or hull reconstruction. New modules: CrewAccess, CrewIdentity; integrations: Game, station poses/targets, Player, missions and DeckMap.

Final combined validation (2026-11-07): `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test -- --maxWorkers=1` (119/119 across 25 files), `npm run build`, `npx playwright test --config playwright.monitor.config.ts` (9/9, including the four original Archive scenarios), and `npx playwright test --config playwright.production.config.ts` (1/1) passed. Crew tests cover scan completion, compact factual record including Master's Degree, persistence, cancellation and removal of table authentication. Browser tests use real Chromium Pointer Lock; this does not certify Opera behavior. No screenshots/videos were generated.

Two test corrections were required: the tablet assertion still expected the removed hologram objective; console monitoring needed to allow the single deliberately mocked contact HTTP 503, restricted to that endpoint and response. Other console errors remain failures. Email tests use mocked responses and never send real email; server/provider configuration was unchanged. Migrated legacy E2E files outside the monitor suite were not all rerun. Known large bundle and upstream Three/Rapier deprecation warnings remain. No new GPU/frame-time benchmark was performed, so no performance improvement is claimed.

Manual review remains: Opera capture restoration, screen legibility at the user's viewport, card alignment, provisional hands and tablet obstruction. Personal retains the existing desktop applications and command terminal; new minigames and final visual assets are deferred.

The updated coordinate/collider/camera implementation plan is in `bridge-layout-proposal.md`. It locates coffee and Personal near the rear as most recently requested. No geometry work is authorized by this document itself.
