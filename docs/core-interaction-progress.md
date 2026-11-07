# Architecture and core interaction revision

Scope from the owner's attached brief (2026-11-07): architecture, session gameplay, power/identity, physical bulkhead and event-driven subtitles. The owner handles UI styling, spacing, typography and HUD design. No new dependencies, general CSS redesign, assets, minigames or tactical-table work. No automatic screenshots/videos.

## Phase 1 — Behavior-preserving architecture

- `Game.tsx` now composes the scene and coordinates protocol events; it no longer owns keyboard/pointer-lock listeners or the HUD tree.
- `useStationControls.ts` owns mode, tablet state, capture callbacks and keyboard lifecycle. Synchronous capture from real gestures remains intact. It does not replace Three's raw-input handling or Rapier movement.
- `GameWorld.tsx` groups the physical scene, station interfaces and input adapters. `GameHud.tsx` preserves the existing markup/classes and consumes state; it does not create another gameplay store.
- `interaction/hints.ts` replaces the deeply nested hint ternary with a typed switch. Canvas render policy and objective rendering use explicit branches.
- Interaction reuses its hit array while retaining nearest-surface occlusion. The unreachable old hologram mode/target/camera path was removed; legacy visual prototypes and the intentionally reserved astronaut arm remain unmounted.
- No physics integration or player-camera interpolation changes. Declarative Rapier collider cleanup remains owned by Rapier. The existing protocol reducer remains authoritative for objectives, while scan phase is transient animation state.

Phase 1 gate: typecheck, lint, format, 125 unit tests/27 files and build passed. Six real browser scenarios passed (3.0min): crew, communications, personal, tablet, physical Archive and quick Archive. Focused hook tests mock document lifecycle only; the browser scenarios separately check real Pointer Lock.

Technical debt: legacy unmounted visual prototypes, historical documentation sections, broad scene raycast traversal (array reuse does not eliminate Three's internal hit objects), and a large game bundle. No frame-rate improvement claimed. Further state/door/dialogue changes belong to subsequent phases.

## Subsequent approved behavior

Phase 2 completed: `useProtocol`/`useCoffee` create fresh in-memory state; only their two legacy keys are removed on mount. The load/save/parser path and obsolete restoration tests were removed. DEV diagnostics expose copied session observations for tests, without setters or production inclusion. Typecheck, lint, format, 116 unit tests, build and 2 E2E passed (identification reset plus real power/tablet/coffee refresh journey). Existing professional data, contact provider behavior and unrelated preferences were not changed.

## Phase 3 — Power and identity

One auxiliary switch remains in the airlock at `[-1.4, 1.65, 6.1]`; restoring power is one-way. Crew Access occupies the former interior-switch zone at `[2.05, 1.65, 4.65]`, rotated PI, with its screen facing the bridge. Its frame clears the doorway by 0.15m. Camera focus, map guidance, card animation and physical support follow that pose. Scan time uses elapsed seconds, including low frame rates; cancellation leaves the objective incomplete.

Gate: typecheck, lint, format, 117 unit tests, build and 3 E2E passed (single switch, identity/reload and cancelled identity).

## Phase 4 — Sliding bulkhead

`SlidingBulkhead.tsx` and the pure `bulkhead.ts` rules implement closed → unlocking (0.35s) → opening (1.4s) → open. Two retained kinematic bodies carry their own geometry and colliders. Centers move from X±0.625 to ±1.925 at Y1.65/Z5.12, behind the wall and Crew Access support. The final inner edges at X±1.3 clear the existing 2.5m opening. Unlocking retracts the latch; status lights indicate opening/open. There is no closing mechanic or extra audio asset. Reduced motion preserves state transitions with an immediate slide. Physics pause/hidden-page handling freezes motion.

Gate: typecheck, lint, format, 124 unit tests/28 files, build and 3 E2E passed. Actual keyboard movement tested closed collision, moving leaf separation, open crossing and return, reduced motion and relocated identity. Static review found no blocking issue. Visual appearance of pockets/latch remains for the owner's manual review; no captures were generated.

## Phase 5 — Dialogue and tablet access

`dialogue.ts` owns English event text, durations and the pure serial/deduplicating queue. `useDialogue.ts` owns timeout/visibility cleanup and preserves remaining reading time while hidden or the HTML alternative is active. Arrival, tablet, identity and completion reuse exact GDD lines. Entry-state events supersede obsolete door instructions. Reopening an interaction cannot repeat the same session event. Skip Tutorial clears current/pending guidance; no voice audio is required.

`Game` connects power, door phases, tablet, identity, actual Archive review, communications outcome, dossier and all-objective completion. Completion requires all six objectives even when explored out of order. A skipped dossier does not claim a download; a skipped transmission explicitly sends no email; acceptance is reported only through the existing confirmed provider callback.

Quick Portfolio Access moves to the focused tablet and opens the same physical Archive. One `Read without 3D` action there retains the shared semantic HTML portfolio. Without WebGL or after a scene error, App exposes direct HTML access independently of the tablet. Redundant monitor/HUD HTML buttons and the imperative App-to-Archive ref are removed. T/R, Escape, return capture, content and CSS remain unchanged. The tablet button is disabled during camera transitions, matching the keyboard guard. A single subtitle presenter belongs to the active modal for screen-reader and keyboard access; expiry restores focus if Dismiss held focus. Final validation is summarized below.

Bridge measurements use 90 frames at 1280×720 in Chromium SwiftShader (software rendering). The latest regression measured 119 draw calls/37,704 triangles, 252.3ms median and 283.4ms p95; an earlier run in this task measured 123 calls/37,752 triangles and 115.4/126.1ms. Frustum and software-renderer timing vary between runs: these numbers do not establish a hardware GPU improvement or regression. No new lights, shadows or postprocessing were added. Opera hardware-accelerated performance remains a manual check.

The first Phase 5 gate passed typecheck, lint, formatting, 135 unit tests/30 files and build; production also passed. The expanded browser run initially passed 20/23. Follow-up fixed ambiguous status selectors, native scroll, input activation and the preserved-tablet return expectation. These initial failures are retained here as evidence, not outstanding issues. No automated email was sent; API behavior uses controlled mocks.

Follow-up evidence: the six-objective journey and Crew Access passed after selector correction. Returning from the HTML view preserves the focused tablet, so its test now closes that tablet explicitly. Native wheel input repeatedly reached the correct scrollable monitor pane (scrollHeight1139/clientHeight387) while scrollTop stayed 0. `physicalScroll.ts` therefore routes unhandled wheel input only inside transformed physical screens, with bounded pixel/line/page deltas and nested overflow support; HTML fallback and keyboard scrolling stay native. `Player` now registers stable keyboard listeners, records intent after native capture while waiting for the React activation commit, and clears input on actual loss of control. Physics remains gated by active; MouseLook/raw Opera input is untouched. The focused regression was rerun after these fixes.

Scroll root cause confirmed by native-event observation: the transformed monitor received `cancelable:false` wheel events despite an element-level listener. Registering a non-passive capture listener at document level makes the event cancelable; the adapter filters strictly to its mounted physical-screen descendants and removes the listener on unmount. Native E2E measured exactly 0→700 scrollTop for deltaY 700, without double scrolling. Ctrl zoom, previously handled events and non-cancelable events remain untouched. The initial movement/HTML-return regression passed after stable input listeners and the correct preserved-tablet return expectation. A tablet movement test was rerouted through a clear side aisle because its original forward path hit the central table collider; collision behavior was preserved.

## Final verification

- Final production rebuild and browser scenario passed (42.5s): entry, real Pointer Lock, tablet/physical Archive, HTML return, security headers/CSP and absence of development diagnostics. Its initial30s total budget expired on the software renderer; the final90s budget retains bounded per-action assertions.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test -- --maxWorkers=1` and `npm run build` passed. Latest full unit run: 138 tests/31 files; the three scroll tests also passed after the non-cancelable-event guard.
- 25 distinct development E2E scenarios were exercised during this revision (the 23-case expanded suite, full recovery journey and focused native-scroll regression). Initially failing scenarios were fixed and passed on rerun. The final focused regression covered bridge movement/jump/collision, bulkhead, Communications, Personal Workstation, tablet T/R, Archive scroll/download/Pointer Lock and HTML return: 5 passed in the first seven-case run; the remaining two passed after fixing the clear-aisle test route and cancelable-wheel registration.
- Native scroll was verified on both quick and physical-E Archive entry. Full mission completion, subtitle expiry/deduplication, reset on refresh, no-WebGL/mobile HTML, coffee and command/photo extras were also exercised. Browser checks use Chromium and real input/Pointer Lock, not a Pointer Lock mock.
- No CSS, professional data, dependencies, Blender assets or new optional activities were added. Production contact delivery code and credentials are unchanged; E2E used mocked acceptance/failure and Skip was verified to send nothing.
- Manual review remains: door pockets/latch appearance, subtitle visual placement/readability and Opera with hardware acceleration. No screenshots or videos were generated. The large game-bundle warning and legacy unmounted visual prototypes remain known technical debt.
