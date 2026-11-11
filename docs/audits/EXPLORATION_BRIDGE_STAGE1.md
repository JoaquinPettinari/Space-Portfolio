# Exploration bridge — Stage 1

Implemented after approval of EXPLORATION_BRIDGE_STAGE0.md. Only footprint, containment, structural front/side framing and visible exterior shell are implemented. The source modular GLBs remain preview-only.

## Geometry

- Gameplay deck: 9.6 × 13.5 m on structural centre lines; rear Z=5.1, bow Z=-8.4; broad windshield 3.8 m. Five forward edges replace the former three shallow edges.
- BridgeFloor derives both its visible extrusion and convex collider from the same approved polygon. ShipHull derives wall placement and yaw from those edges.
- ExteriorHull replaces the old broad wings with modest side plating and an actual nose deck, Z=-8.4..-11.2, Y=.8.. .55. The exterior is visual only; existing interior wall colliders contain the capsule.
- Old front roof panels were removed because they would float over the extended deck. The retained rear roof begins at Z=.4. The forward canopy is intentionally open until stage 2; this is not the final ceiling/glazing design.
- Rear service niches retain their old outer envelope temporarily so the photo, Personal Workstation and other screens do not move in stage 1. The 9.6 m figure describes the main floor, not the maximum extent of those niches or exterior plating.
- Temporary console wings are shortened to preserve walking access around them. All monitor transforms, focus cameras and interfaces remain unchanged; the diagonal console is stage 3.
- DeckMap only adjusts coordinate projection to fit the longer footprint; no styling or interface redesign.

## Files

bridgeLayout.ts, BridgeFloor.tsx (consumes updated data without edits), ShipHull.tsx, new ExteriorHull.tsx, BridgeRoof.tsx (rear-only retention), DeckMap.tsx (projection), bridgeLayout.test.ts, architecture-v2.spec.ts and dev-only GameDiagnostics.tsx (read-only visibility observation).

## Validation

Validation executed: 12 relevant unit tests passed (bridgeLayout, station and bulkheadAsset); 6 native-browser E2E scenarios passed (entry journey, new bow circulation/containment/sightline, Communications, Personal Workstation, Archive and Quick Portfolio Access), with no captured page exceptions or unexpected console errors. The full unit run was interrupted after it stopped returning progress; it is not reported as passed. Focused tests were then run successfully with one worker. Typecheck, lint and production build passed after the final changes. Development diagnostics/viewer are absent from the generated production JavaScript. Targeted formatting passed; repository-wide format:check still reports four unchanged supplied specification/source documents. The existing large-bundle warning remains; frame performance is not inferred from bundle size. Screenshots, videos and traces remained disabled. The E2E bow scenario uses real movement around both sides of the existing console, tests the closed forward wall by walking into it, checks eye height and a read-only unobstructed camera ray to the nose, and returns to the rear room. The visibility ray is not a screenshot or a claim of visual/art approval. It ignores hidden ancestors and low-opacity glass; diagnostics remain development-only.

Manual review: proportions of long bow, visible nose from the current stations, rear niche joins and staged open front roof. No new lights, transmission materials, postprocessing, assets or dependencies. No screenshots/videos generated. The next stage requires visual review before adding the new sloped canopy.
