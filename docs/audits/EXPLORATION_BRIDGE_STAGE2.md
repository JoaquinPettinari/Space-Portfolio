# Exploration bridge — Stage 2: roof and glazing

Stage 2 closes the gameplay canopy after approval to continue. The forward console, physical screen transforms, React interfaces, mission state, airlock and player controls remain unchanged.

## Geometry and materials

- Rear roof: Y=3.30 m. Long transition reaches Y=3.05 at Z=-6; forward glazing descends to Y=2.75 at Z=-8.4.
- `roofHeight` and `roofHalfWidth` define a continuous profile shared by the canopy and forward window edges. Window headers no longer retain the old constant height.
- 22 planar panels: eight glazed overhead panels, solid rear/spine panels and retained service-niche caps. 55 unique frame segments; shared seams are generated once. These counts describe structure, not a frame-rate benchmark.
- Glass opacity .045 and depthWrite=false; front windows render toward the interior, overhead glass renders its inward face. No transmission, screen-space reflections, shadow maps or new actual lights.
- `HullPanel` shares planar panel construction between roof and faceted windows. `HullBeam` constructs frame geometry from endpoint vectors. Both are static; no per-frame allocations or React state updates were added.
- Roof colliders extend 0.09 m below the nominal panel to conservatively enclose rotated 12 cm frames, and 0.10 m above. Lowest conservative collision surface: 2.66 m, compared with the 1.90 m capsule. The rear supports the full normal jump. Forward jump/headroom is checked with native input; the test is not a claim that every jump necessarily hits the ceiling.
- Old 4.5 m rear walls/corner panels and their colliders are trimmed to 3.3 m. The rear opening remains 2.52 m high. Service caps close the retained rear niches without moving their monitors.
- Existing four amber roof strips are repositioned under the new rear roof. The emergency beacon is mounted at Y=3.10 (roofHeight minus .20), keeping its casing below the roof; its state, intensity and timing are preserved.

## Files

`bridgeLayout.ts`, `BridgeRoof.tsx`, new `HullPanel.tsx`, `ShipHull.tsx`, `Greybox.tsx`, `CabinLighting.tsx` (beacon mounting only), `bridgeLayout.test.ts`, `e2e/architecture-v2.spec.ts`, and documentation.

## Validation and remaining review

Unit checks cover convex footprint, projected roof coverage, boundary heights, walking clearance, jump intent, terminal framing and door sweep. Browser checks cover actual entry/door progression as part of the bow journey, movement around the console, forward jump/landing, visible exterior nose, and physical terminals. 16 focused unit tests and four E2E scenarios passed. No page exceptions or unexpected console errors were captured. The E2E run preceded the final cosmetic lowering of the beacon; that mounting change is checked statically and remains for manual visual review. Typecheck, lint and production build passed after the beacon adjustment. Targeted formatting and diff whitespace checks passed; repository-wide format:check still flags the same four unchanged supplied documents. No screenshots or videos were generated.

Manual visual review remains necessary for overhead visibility against bright planets/dark sky, frame density, transparency sorting and material appearance. Existing large-bundle warning is not treated as a performance result. Full hardware FPS/draw-call profiling and material consolidation remain stage 5.

Stage 3 (diagonal console and screen anchors) has not been implemented. The modular GLBs remain development-preview assets, not the production hull.
