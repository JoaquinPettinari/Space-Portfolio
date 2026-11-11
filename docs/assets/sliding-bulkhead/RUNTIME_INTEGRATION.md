# Sliding bulkhead: runtime integration

## Scope and attribution

Supplied original procedural asset: `public/models/cruz-del-sur-sliding-bulkhead.glb` (23,864 bytes). Source instructions and attribution remain in `docs/assets/sliding-bulkhead/INTEGRATION.md`. The source GLB is unchanged. No new dependencies or textures.

The user approved the local entrance adaptations after the initial clearance audit. Only the rear doorway, corridor walls and door pockets changed; HUD, computer interfaces, missions and the remaining bridge layout are untouched.

## Measurements and transforms

- Original outer bounds: 3.40 x 3.115 x 0.65 metres.
- Original leaf parent positions: left X=-0.685, right X=+0.685; stored before extraction and incorporated into the rigid-body poses. Each assembly retains its children and original rotation/scale.
- Natural scale 1. Door orientation: Y rotation 0 (detailed face toward the entry spawn).
- Sliding plane origin: [0, -0.18, 5.65]. Leaf geometry occupies world Y=0..2.50 and Z=5.53..5.89. Moving leaf bounds include the decorative centre overlap.
- Each leaf travels 1.37 m; open extents reach X=±2.74, leaving the leaf inner edges at ±1.36.
- The supplied solid jambs intersect the leaf sweep without adaptation. The fixed GLB assembly is offset by -0.48 along its local Z, placing the frame origin at world Z=5.17 while leaf parent origins remain at Z=5.65. No source geometry is distorted.
- Original 9 cm threshold is below floor after the -0.18 Y offset. Continuous playable floor remains Y=0.
- Rear wall opening: X=±1.34, Y=0..2.52. Decorative seals narrow the visual opening slightly to 2.675 m. Upper infill and existing rear-wall colliders match the new opening.
- Pocket shells: front Z=5.34..5.46; rear Z=5.91..6.07; outer end caps X=±2.79..±2.91; roof underside Y=2.52. The corresponding leaf sweep clears these boundaries. Shared shell dimensions live in BULKHEAD_POCKET_PANELS, used by visuals, colliders and geometric tests.
- Corridor side walls now begin at Z=5.90. Lower light strips were shortened to match. Spawn remains [0, eye height, 7]; auxiliary switch and Crew Access retain their positions and interaction targets.

## Behavior

Existing closed → unlocking → opening → open state machine and power requirement remain authoritative. Existing unlock delay 0.35 s and opening duration 1.4 s remain. Named leaf assemblies and simple cuboid colliders share kinematic rigid bodies; physics updates move both together. Reduced motion preserves the final opening. Fresh page load closes the door. Indicators use separately owned materials, red without power and green after restoration.

## Validation

- 18 unit tests passed (asset clearance, bulkhead state/timing, protocol).
- Actual supplied GLB tested at 41 positions across the sweep against every fixed frame mesh bounding box and pocket panel. Floor contact ignores floating-point errors below one micrometre.
- Typecheck, lint and production build passed. Existing large 3D bundle warning remains.
- Targeted formatting and diff whitespace checks passed.
- Manual review pending: frame depth, pocket enclosure appearance and overall proportions. No screenshots or videos generated.

### Browser verification

All three relevant E2E scenarios passed after updating legacy prompt selectors and old procedural-leaf dimensions: powered opening with continuous collider observations and a return crossing; reduced-motion opening and return; page-reload reset after actual gameplay. Native keyboard/mouse and Pointer Lock were used. No page exceptions or console errors were captured. Screenshots, videos and traces remained disabled.

Repository-wide format:check reports the three supplied specification documents (sliding-bulkhead/INTEGRATION.md, switch-lights/INTEGRATION_POWER_SWITCH.md and CRUZ_DEL_SUR_TERMINALS_SPEC_v1_2.md). They were left untouched; all files edited for this integration pass targeted formatting.

## Entry-facing orientation correction

The door now faces the entry spawn (+Z), as requested. Leaf origins shifted by -0.12 m in Z to compensate for the asymmetric mesh depth when reversing orientation. The swept world volume and collider coverage remain Z=5.53..5.89. Left/right parent ordering follows the new orientation; each leaf continues moving outward into its existing pocket.

## Architecture v2 relocation

The previous integration measurements above describe the original local placement. Architecture v2 adds ENTRY_OFFSET=6 m to the entry and door: leaf origins are now Z=11.65, swept depth Z=11.53..11.89. Pocket coordinates likewise gain 6 m. The fixed jamb/header colliders travel with the door. Spawn is now [0, 1, 15.1] (body initial position; standing camera settles to player eye height). The independent docking hatch is at Z=14.2. Power is [-1.4,1.65,12.4] and Crew Access [1.4,1.65,12.8].

Power plus successful crew identification requests the existing unlocking/opening sequence automatically. E on the bulkhead cannot bypass identification. The six-metre glass passage connects the entry to the unchanged bridge rear boundary Z=5.1. Gameplay and asset coordinates are distinct: the newly supplied modular GLBs are only available in the isolated development preview documented in ../modular-architecture/INSPECTION.md.
