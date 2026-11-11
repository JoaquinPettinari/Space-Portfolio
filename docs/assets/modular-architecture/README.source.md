# CRUZ DEL SUR — Modular Architecture Prototype v0.1

Three actual GLB files assembled from the user's uploaded `GLB format.zip` kit and custom structural meshes. Prototype only; no game logic, colliders, animations, actual glass material, or fully functioning terminal displays included.

## Files
- `01-entry-module.glb`: small powered-access room, floor, walls, ceiling, placeholder for auxiliary switch.
- `02-panoramic-passage.glb`: short passage with modular floor, window framing and partial overhead cover. Side apertures are open (no transparent glazing geometry).
- `03-faceted-bridge.glb`: angled panoramic bow, sloped upper skylight ribs, rear technical ceiling, three-part horseshoe console, decorative workstation references. Windows and skylights are **open frames**, not sealed glass.
- `build.py`: reproducible generator; requires `trimesh`, `numpy`, and the original ZIP in the path indicated in the script. Not needed to use GLBs.

## Coordinate assumptions
- All GLBs are local-space, +Y up; scale 1 unit ≈ 1 meter for the assembled prototype (original kit models were scaled).
- Intended arrangement with shared origin: bridge towards negative Z, entry towards positive Z. Entry z≈3.2..6.8; passage z≈0..3.6; bridge z≈-10.5..0.
- Entry and passage overlap slightly around z≈3.2–3.6. Resolve junction before final integration; do not blindly stack meshes.
- Doorways, hull sealing, floor trimming at angled edges and roof-to-wall joins are NOT finished.
- Passage length ≈3.6m; crossing time depends on player walking speed (target 2–3 seconds, tune to actual movement speed).
- Bridge approx 9.3m across rear and 10.5m long; front bow tapers to approx 6.5m.

## Implementation / integration warnings
- First import each GLB into an isolated preview/test scene and inspect geometry, orientations, clipping and material appearance.
- Do not replace production bridge until user approves prototype. Existing terminals and missions should be preserved.
- Console is a placeholder shell. Use existing React/Html screens; anchor names `CENTRAL_ARCHIVE_ANCHOR` and `EARTH_COMMS_ANCHOR` are *markers*, not final display meshes. Position and orientation need tuning.
- The auxiliary switch in the entry is only a placement reference. Reuse the existing animated power-switch GLB and state.
- The tactical table, coffee and personal computer are scale references, not final replacement objects.
- Use simple Rapier colliders authored from intended walkable hull and frames, not trimesh on every decorative part.
- Transparent glazing should be added as a small number of carefully tuned Three.js surfaces; avoid expensive transmission and overdraw. Use metal framing to communicate glazing even before adding actual panes.
- Meshes are modular but exported with many separate scene nodes; merge/instance repeated static meshes as needed after visual approval.
- The included geometry was built from the user's uploaded kit. This package does not include proof of the original kit's license. Verify the exact kit/source and license before publishing attribution. Do not credit the wrong author.

## Design intent
- Entry module: emergency ambience, physical auxiliary power control.
- Short passage: optional look-out, no mandatory objectives.
- Bridge: faceted bow, shallow open U console against forward windows, sloped skylight above consoles, rear industrial ceiling.
- Crew Access should be placed at the bridge bulkhead and auto-open the door after verification, but this package does not implement behavior.
