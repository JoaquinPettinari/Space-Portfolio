# Exploration bridge — Stage 3: diagonal command console

## Implemented geometry

The approved three-segment console now follows X,Z (-3.3,-5.95) → (-1.6,-7.65) → (1.6,-7.65) → (3.3,-5.95). Depth is 1.05 m, top Y=1.04, with collision volume Y=0..1.02. The shared offset-line intersections produce exact miter joints. Visual extrusions and convex colliders use the same four footprint vertices per segment, avoiding overlapping rectangular wings.

Archive is on the left (+45° yaw), Communications on the right (-45°). Their screen centers are (-2.379289,1.65,-6.729289) and (2.379289,1.65,-6.729289). Chairs sit at X=±1.672183, Z=-6.022183 with the corresponding rotation. Their low backs remain below the focused camera.

`commandLayout.ts` derives these anchors from the console path. `TERMINAL_SCREENS` supplies the same pose to monitor housings, Drei Html and the existing dynamic focus calculation. At 16:9/FOV65, focused cameras are (±1.634821,1.65,-5.984821). Other viewport ratios continue to fit the bezel through `monitorDistance`; no fixed desktop camera distance replaces that behavior. Display size 1.6×0.9 m, HTML surface 960×540 and existing UI are unchanged.

Low central controls replace the obsolete control positions. No extra large central screen, lights, assets or dependencies were added. Static geometry is memoized, label textures retain cleanup, and no new frame listeners or state were introduced.

Rear service walls now follow X=±4.8. Temporary roof niche caps and obsolete outer/corner wall geometry were removed. The rear wall segments now end at ±4.8 and retain the 2.68 m doorway. Personal Workstation and the photo/technical panels move 0.2 m inward as approved: Personal body X=4.35, screen X=4.205, desk X=4.2, photo X=-4.58, technical panel X=4.58. Table, coffee, Crew Access, airlock and power/door state are unchanged. The tablet map follows the shared console path and rotated screen anchors without a UI redesign.

## Changed files in this stage

- `src/game/world/commandLayout.ts` and `.test.ts` (new): console footprint, miter intersections, colliders and station anchors.
- `Workstation.tsx`, `bridgeLayout.ts`, `bridgeLayout.test.ts`: continuous geometry and roof-niche removal.
- `ShipHull.tsx`, `Greybox.tsx`, `RearWorkstation.tsx`: rear envelope and approved mounting adjustments.
- `src/game/interaction/station.ts`, `.test.ts`: shared rotated screen contract, photo focus and framing assertions; removed unused +Z-only focus helpers.
- `src/game/ui/DeckMap.tsx`: actual station coordinates/orientation.
- `e2e/helpers/game.ts`, `e2e/physical-monitor.spec.ts`, `e2e/architecture-v2.spec.ts`: physical approach routes and rotation-aware projected-screen check.
- `docs/architecture.md`, this report.

## Verification

Completed: 34 focused unit tests across nine files and five native-browser scenarios. The first E2E batch passed all four terminal scenarios and failed the obsolete circulation waypoint; after correcting the route, the circulation scenario passed separately (1.8 minutes). No unexpected browser console errors or page exceptions were recorded. The complete historical unit/E2E suites were not run in this stage.

Unit coverage checks exact miter continuity, wall clearance, ±45° orientation, approach/chair clearance, adaptive camera fitting, input cleanup, physical scrolling and interaction hints. Browser tests use real keyboard/mouse input and native Pointer Lock. Contact requests are intercepted, never sent to a provider. Scenarios cover Archive records/CV, ungated Quick Access, Communications Skip/503/accepted retry, Personal Workstation keyboard/apps/CV, and bow circulation/containment/jump/landing/return/exterior sightline.

Successful commands: `npm run typecheck`, `npm run lint`, `npm run build`; two `npm run test -- --maxWorkers=1 --reporter=verbose` runs with the nine relevant files (16 + 18 tests); selected `npx playwright test --config playwright.monitor.config.ts` scenarios; targeted Prettier checks and `git diff --check`.

Repository-wide `npm run format:check` still fails only on four untouched supplied documents: `docs/assets/modular-architecture/README.source.md`, `docs/assets/sliding-bulkhead/INTEGRATION.md`, `docs/assets/switch-lights/INTEGRATION_POWER_SWITCH.md` and `gdd/CRUZ_DEL_SUR_TERMINALS_SPEC_v1_2.md`. Production build retains the existing large-chunk warning (Game JS approximately 3.339 MB before gzip). No build failure.

The initial circulation test targeted X=3.95,Z=2.7, which now falls inside the relocated Personal Workstation desk clearance. Its waypoint was moved into the aisle (X=3.3), preserving real movement and collision assertions. The new central console is tested as a barrier before Z=-6.87 rather than walking through it to the outer window.

## Manual review / limits

No screenshots or videos generated. Review monitor angle/readability, camera approach transitions, joined console edges, rear prop mounting and exterior visibility manually. Runtime performance profiling on the target GPU remains stage 5; build size is not a frame-rate benchmark. The approved stage 4 entry reorganization is not implemented here. The modular GLBs remain isolated development-preview assets.
