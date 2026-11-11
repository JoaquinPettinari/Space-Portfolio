# Exploration bridge — Stage 4: technical entry

## Scope and coordinates

The same entry room is widened; no extra room, interaction state or mission was added. Technical floor: X=-2.8..2.8, world Z=11.2..14.3, Y=0. Side walls leave X=-2.7..2.7 free. Ceiling remains Y=3.6 at its underside. The original arrival vestibule, spawn (0,1,15.1), docking hatch Z=14.2, bridge bulkhead leaves Z=11.65 and panoramic passage Z=5.1..11.2 remain in place.

Rear jambs close the expanded room around the original 2.4 m docking hatch. The front header closes the volume above the unchanged sliding-door pockets. Visual panels and colliders consume the same `ENTRY_PANELS` dimensions, with no duplicate old shell.

Auxiliary power logical anchor: (-2.7,1.65,13.4); GLB visual root: (-2.62,1.65,13.4), yaw +90 degrees. Existing lever, pivot, indicator, completion callback and power requirement are reused.

Crew Access body: (2.00,1.65,12.37), yaw 0. Screen: (2.00,1.68,12.515). At 16:9/FOV65, focus is approximately (2.00,1.68,13.567838). The same physical terminal, card animation, React identity, Html and camera contract are reused.

### Small mounting correction to the approved draft

The draft body center (1.95,1.65,12.04) did not include the existing support extending 0.30 m behind the terminal. Its rear end would intersect the sliding-leaf volume. Moving the body 0.33 m toward the room puts the support rear exactly against the pocket's front face Z=12.07. The casing also moves 0.05 m right: its left edge is X=1.35, clear of the doorway edge X=1.34. Its right edge X=2.65 remains inside the side wall X=2.7. Leaf travel and source assets are unchanged.

## Behavior

Spawn → free docking hatch → auxiliary power lever → Crew Access → existing automatic bulkhead opening → glass passage → bridge. Neither power alone nor identification alone changes the existing authorization rule. Refresh resets the session. Quick Portfolio Access remains ungated. No changes to bridge geometry, UI styling, professional information or Pointer Lock code.

The tablet map mirrors the widened technical module, narrow arrival vestibule and updated physical control anchors. E2E helpers walk to the new controls with real keyboard and mouse input; diagnostics remain read-only.

## Files

- New `src/game/world/entryLayout.ts` and `entryLayout.test.ts`.
- `EntryAirlock.tsx`: shared physical/visual enclosure.
- `src/game/interaction/station.ts` and `station.test.ts`: moved control/screen poses and straight-on framing.
- `bulkheadAsset.test.ts`: actual GLB leaf sweep checked against the new enclosure and terminal/support bounds.
- `src/game/ui/DeckMap.tsx`, `e2e/helpers/game.ts`, `e2e/bulkhead.spec.ts`, documentation.

## Validation

Typecheck, lint and production build passed. The six relevant unit-test files passed 26 tests; the actual GLB sweep test was then extended to include the new enclosure and reader support and passed again. Four native E2E scenarios passed across the focused runs: progression/reset, reduced-motion crossing, ungated Quick Archive access, and animated-leaf collision/return crossing (final retry: 1.8 minutes). No unexpected browser console errors or page exceptions were recorded in those passing scenarios. Relevant unit checks cover room joins, entry clearances, camera pose, actual GLB sweep, door state, lever and identification. Native browser scenarios cover entry progression and reset, closed/open door collision and return crossing, reduced motion and ungated Archive access. No screenshots or videos. The first E2E attempts exposed stale test navigation: input was being sent before camera return completed, and a held-forward waypoint could be overshot. Tests now wait for the actual return pose AND the restored Crew Access interaction prompt (confirming gameplay interaction is active), and approach Crew Access directly until its real E hint appears instead of insisting on an unnecessary fixed waypoint; real blocking collisions still time out. The original movement helper is retained with failure diagnostics; no general navigation system was introduced. These are test-helper changes, not gameplay shortcuts.

Repository-wide format checking flags the same four untouched supplied documents as stage 3. Changed-file formatting and diff whitespace are checked separately. The existing large-bundle warning remains; no GPU performance improvement is claimed. Full historical test suites were not rerun.

## Manual review

Review the wider entry proportions, forward-facing Crew Access, ID-card animation, mounting seam and power-switch reach. Very narrow portrait viewports require manual review: the existing frame-fit camera backs away farther than its desktop pose, toward the docking jamb. The accessible HTML portfolio remains available. Stage 5 decoration/performance work is not started.
