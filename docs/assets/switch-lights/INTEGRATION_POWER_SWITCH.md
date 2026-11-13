# CRUZ DEL SUR — Auxiliary Power Switch v0.1

## Deliverables

- `cruz-del-sur-auxiliary-power-switch.glb` — original procedural 3D model (CC0, created for this project)
- `create_switch.py` — reproducible generator

## Geometry and coordinates

- Dimensions: approximately 0.35 m wide × 0.55 m high × 0.20 m deep, including lever.
- Local X = horizontal; Y = vertical; Z = outward from wall. Backplate is at negative Z.
- Intended to be mounted vertically, centered at the current airlock switch interaction position.
- Parts are named and separate. No animation clip or embedded game logic is included.
- Fixed mesh node: `LeverPivotFixed`. The moving parts are `LEVER_SHAFT_ANIMATE`, `LEVER_GRIP_ANIMATE`, `LEVER_GRIP_AMBER_ANIMATE`.
- Pivot point (GLB local coordinates): `[0, -0.072, 0.091]`. Animate the three moving parts as one group around this point, rather than rotating each around its own center.
- `Indicator_OFF_Red` and `Indicator_ON_Green` are separate meshes. Toggle emissive intensity or material colors based on existing power state. Avoid a permanently lit green indicator while power is off.

## Expected interaction

1. Player approaches the single existing auxiliary-power interaction in the airlock.
2. Presses E once (existing interaction state machine; ignore repeated E during animation).
3. Lever rotates about its pivot approximately 60–75 degrees over 0.5–0.7 s; check the direction visually and avoid intersection with housing.
4. At lever latch/end of animation, call the **existing** `restoreAuxiliaryPower` or equivalent action, not a new duplicate state.
5. Switch red OFF indicator off and green ON indicator on; trigger the existing light sequence and approved subtitle cue.
6. Remain ON for the current session. Reset to OFF on fresh page load according to the current no-persistence decision.

## Integration notes

- Prefer existing `useGLTF` loading. `clone` if materials will be changed or the asset is reused.
- Example pivot wrapper: create a THREE.Group at `[0, -0.072, 0.091]`, then reparent moving nodes using `group.attach(node)` to preserve their world transforms; animate `group.rotation.x` or `rotation.z` according to visual fit (for an upward lever, local X rotation makes it swing forward/back).
- This GLB is a visual prop. Keep a simple interaction collider/raycast target from the current system. Do not use detailed mesh physics.
- Colors are vertex colors with basic PBR defaults; glow must be added with material emissive values and nearby Three.js lights if desired.
- The model is deliberately low-poly and stylized. It is an initial functional asset, not a photorealistic replacement for professional Blender assets.
- Do not alter HUD, computer interfaces, or the bridge.

## Validation

- Verify lever moves when E is pressed, never on render alone.
- Verify one power state source of truth and no duplicate switch.
- Verify door stays locked until power is restored.
- Verify no clipping with wall, hands, or player camera.
- Verify red/green indicator states and reset behavior.
- Run typecheck, lint, unit tests, and build.
