# CRUZ DEL SUR — Sliding Bulkhead v0.1

## Asset

- `cruz-del-sur-sliding-bulkhead.glb`
- Original procedural prototype, no external source meshes or textures.
- Overall closed outer bounds: ~3.40 m wide × 3.115 m high × 0.65 m deep; Y-up, floor Y=0, front facing +Z.
- Clear opening when leaves move: approximately 2.74 m wide × 2.50 m high (verify in scene).
- 50 simple mesh parts; materials are flat PBR colors, no texture maps. It is a **blockout-quality model**, not a photorealistic finished asset.

## Moving parts

Two parent nodes in the GLB hierarchy:

- `LEAF_LEFT_SLIDE` initial local position X=-0.685; animate its local X by **-1.37 m**.
- `LEAF_RIGHT_SLIDE` initial local position X=+0.685; animate its local X by **+1.37 m**.

All children are attached to those nodes. Find the parent `Object3D` with `getObjectByName()` and store its **initial position**; animate relative to that position. Do not animate each child mesh separately. Do not apply world coordinates as local coordinates.

**IMPORTANT**: This asset has no animation clips; `E` behavior is implemented in the existing game. The leaves need physical wall pockets or an unobstructed side volume (~1.37 m per side) when fully opened. Do not place them through the hallway walls or leave them visibly floating. Inspect the real opening and wall geometry before integrating. If pockets are impossible, stop and propose a narrower or telescoping mechanism.

## Behavior

1. Power off → door closed and locked, status red.
2. Restore power → door unlocks (optional short delay), E triggers opening.
3. Animate left/right slide over ~1.2–1.6 s using smooth ease-in/out, no instant disappearance.
4. Keep colliders blocking until enough clear width exists; release/update the existing colliders in sync with leaf positions. No invisible barriers.
5. Door remains open for session; fresh reload resets state and position.
6. Do not create another mission state or power system. Reuse current bulkhead state and interaction.
7. If status colors need to change, modify existing status meshes/materials; avoid material mutations shared with unrelated objects.

## Integration sequence

- Place GLB under `public/models/`.
- Inspect dimensions and orientation in the **actual** scene; verify passage and pocket space before replacing existing bulkhead.
- Reuse the existing collision and power logic; only swap visual representation if appropriate.
- Test locked, opening, fully open, walking across, walking back, and page reload.
- Keep existing old door hidden only after new geometry is aligned and functional.

## Limitations

This is a clean, small prototype with geometric panel details. To reach the ArtStation-quality look, replace or enhance with professional textures, beveled geometry, decals, bolts, and richer materials. The model is designed for iteration, not as a finished cinematic asset.
