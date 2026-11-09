# Auxiliary power switch integration

- Source: public/models/cruz-del-sur-auxiliary-power-switch.glb, 34,060 bytes, 42 meshes, 1,320 triangles, no textures or animation clips.
- Author/license supplied with package: original procedural model for this project, CC0. Instructions: gdd/INTEGRATION_POWER_SWITCH.md (no separate INTEGRATION.md supplied).
- Measured bounds: X [-0.175, 0.175], Y [-0.275, 0.275], Z [-0.08, 0.139] metres; dimensions 0.35 x 0.55 x 0.219 m.
- Natural scale 1; world position [-1.32, 1.65, 6.1], Y rotation PI/2. The 0.08 m outward offset places the backplate against the airlock wall at X=-1.4.
- Three named LEVER_*_ANIMATE meshes share pivot [0, -0.072, 0.091], rotate +175 degrees around local X with easing over 0.6 simulation seconds. Slow frames are capped; pause/background stops progress. Positive rotation swings the handle out of the housing.
- E starts only the animation. Its completion invokes the existing lighting action once. Protocol continues to own power; bulkhead requirements unchanged. Reload recreates OFF state.
- Red/green lamps use two owned materials; geometries and other materials share the cached GLB. No additional light, texture, shadow or dependency. One simple invisible raycast box; existing wall physics retained.
- scripts/assets/create_switch.py preserves the supplied generator. Optional offline requirements: Python, trimesh, numpy. Running it writes a comparison GLB beside the script; it does not overwrite the runtime model. Not executed during integration.
- Narrow requested HUD adjustment: reuse ControlKey for E prompts; remove central crosshair. CSS unchanged.
- Manual review: appearance, lever sweep and wall clearance. No screenshots or video generated.

## Validation

- npm run typecheck and npm run lint: passed.
- Targeted Vitest run (powerLever, protocol, bulkhead): 20 tests passed.
- npm run build: passed; existing large 3D chunk warning remains.
- Targeted Prettier and git diff --check: passed. Repository format:check still reports the two supplied GDD Markdown files; left unchanged.
- Playwright bulkhead tests: both passed with native keyboard/mouse, including locked collision, opening, return crossing and reduced-motion passage. Old readiness selectors were updated from the removed tablet button to the current Game controls element.
- Playwright session reset: passed after actual power restoration, bulkhead traversal and gameplay; reload clears power and progress. Total: 3 E2E passed, no captured console errors or page exceptions.

## Downward lever stop

The ON stop is 175 degrees. Measured GLB grip bounds at 180 degrees intersect the lower plate by 4 mm in Z; at 175 degrees the grip back is Z=0.07369 m, clearing the plate face Z=0.068 m. The original hinge and model are unchanged. An exact 180-degree stop would require a small asset adjustment (for example recessing the lower plate by at least 5 mm). Power completion and lamp logic are unchanged. Manual visual review remains pending.
