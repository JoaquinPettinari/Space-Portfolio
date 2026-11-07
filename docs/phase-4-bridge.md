# Phase 4 — Approved bridge layout

The user approved the coordinate/collision plan on 2026-11-07. This delivery changes the existing bridge incrementally; it does not replace the game or add dependencies, imported assets, cinematic effects, screenshots or videos.

## Geometry and interactions

- Forward console: three contiguous low modules centered at Z=-4; total 7.6×1×1.2. Archive left (-2.4,1.65,-3.82), Communications right (2.4,1.65,-3.82); active screens 1.6×0.9 at Z=-3.715. Two low chairs preserve monitor ray visibility. Shared decorative controls do not claim new gameplay functions.
- Physical HTML interfaces reuse existing professional data, CV and contact behavior. Both forward interfaces use 960×540 CSS pixels with distanceFactor2/3. Camera distance fits the actual bezel vertically and horizontally at 65° vertical FOV. Body position stays at the E interaction point.
- Personal is on the rear starboard wall (4.55,1.65,2.1), with a 0.8×0.9×1.8 desk. Coffee moved to (-4.25,0,3.65), facing inward. The existing project photo moved to (-4.78,1.75,2.2); it is not presented as an invented personal memory.
- Table moved to (0,0,0.5), collider2.1×1.04×2.7; both side corridors remain reserved. Tactical interaction remains phase5. Crew Access stays in the airlock; CV and door keep their working positions.
- Front chamfers replaced by glazed 45° facets centered at (±4.5,2.25,-4.5). Central glass remains8×2.1; broad side glass in the forward half. Opaque rear service panels support the relocated stations. Technical controls are a visual reserve only.
- Graphite structure, off-white service panels, amber strips and restrained cyan screens. Industrial overhead panels/beams have matching simple colliders, with beam bottoms at Y3.3. The player's height and movement rules are unchanged. Existing side fill changed to amber; no extra lights, shadow maps or postprocessing.
- Tablet map and objective guidance match the new layout. Quick Archive and standalone accessible HTML remain available.

## Main files

`world/ShipHull.tsx`, `world/Workstation.tsx`, `world/RearWorkstation.tsx`, `world/Greybox.tsx`, `world/CabinLighting.tsx`, `world/CoffeeMachine.tsx`, `world/ProjectPhoto.tsx`, `world/ArchiveScreen.tsx`, `world/PhysicalTerminal.tsx`, `interaction/station.ts`, `player/Player.tsx`, `Game.tsx`, `ui/Computer.css`, `ui/DeckMap.tsx`, `ui/MissionTablet.tsx`, `missions.ts`, and corresponding unit/E2E tests.

## Validation

Final source gate passed: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test -- --maxWorkers=1` (120/120 across25 files), and `npm run build`. `git diff --check` passed. The monitor configuration exercised12 scenarios: the initial full run passed9 and exposed3 route failures; focused reruns passed Archive and coffee/photo, followed by a successful2/2 run of final hull circulation and the command-terminal/coffee journey. Thus all12 scenarios have successful coverage across these runs; this is not a claim of a single final12/12 invocation. The original4 Archive scenarios remain covered.

E2E uses real keyboard/mouse movement and read-only diagnostics; no teleportation or mock Pointer Lock. Contact tests simulate provider responses and send no real email. Visual comparison with the approved image and Opera validation remain manual. `npx playwright test --config playwright.production.config.ts` passed1/1 (31.8s), covering production entry, security headers, physical Archive and accessible fallback.

Final bridge collision/measurement scenario passed after the rear glass and Personal support adjustments. It walks both corridors, collides with the central table and side/bow walls, jumps, returns through the airlock and reenters. Measurement: 1280×720, 90 frames, 119 draw calls, 37,704 triangles; median272.9ms and p95314.3ms. Renderer explicitly reports ANGLE Vulkan SwiftShader Device (Subzero): this is software rendering, not the user's hardware-accelerated Opera. The result does not demonstrate acceptable frame rate; hardware performance validation remains pending. No dynamic lights or shadow passes were added. Known large game bundle warning remains (~1.11MB gzip).

Browser-route failures exposed stale test assumptions, not a reason to change FPS controls: helpers now verify actual native mouse orientation before moving, and the workstation-to-coffee route re-aims from a rear waypoint. These are real input actions, not state setters or teleports. Some legacy suites outside the monitor configuration were migrated but are not covered by the reported run.
