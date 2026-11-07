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

Pending final run. E2E uses real keyboard/mouse movement and read-only diagnostics; no teleportation or mock Pointer Lock. Contact tests simulate provider responses and send no real email. Visual comparison with the approved image and Opera validation remain manual. Runtime measurements from headless Chromium describe only that environment, not a hardware performance guarantee.
