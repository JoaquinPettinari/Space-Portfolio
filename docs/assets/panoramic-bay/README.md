# Panoramic passage bay — first Blender prototype

Original geometry authored with Blender 5.3 from the user's approved visual reference. No third-party mesh or texture was copied. The reference is inspiration, not a licensed texture embedded in the asset.

## Files and preview

- Editable source: `panoramic-bay.blend` in this folder. Named individual parts and bevel modifiers are retained.
- Export: `src/dev/assets/04-panoramic-bay.glb` (repository root relative).
- Generator: `scripts/assets/build-panoramic-bay.py`.
- With `npm run dev` running, open `/?architecture-preview&bay`. Select View inside / View outside; drag to orbit, right-drag to pan, wheel to zoom. Roof and bounds can be hidden. This module is intentionally excluded from the old kit's Assembled view.

The GLB is development-only and is not loaded by the main game or included in the production bundle. The game geometry, player and collisions have not been replaced.

## Dimensions and construction

Metres, glTF X right, Y up, Z along the passage. Floor datum Y=0. Bay length **2.033333 m**, matching one third of the existing 6.1 m passage. Intended walkway approximately **2.8 m** wide, central ceiling approximately **3 m** high. Sills and gaskets are slightly proud of the wall, and roof shoulders slope inward above standing height; clearance/jump collisions need a dedicated integration check before replacement.

Measured exported bounds: X ±2.075, Y −0.23…3.17, Z ±1.016667. Overall **4.15 × 3.40 × 2.033 m** includes exterior rails and the floor tray; it is not the interior clearance. Future bay centers for the current passage: Z 6.116667, 8.15 and 10.183333, with no scale adjustment.

Assemblies: FLOOR, STRUCTURE, ROOF, GLASS, ROOF_GLASS, OUTER_HULL. Exported pieces are batched by assembly/material. Glass is separately adjustable; there are no doors, animations, cameras, lights or physics in this asset.

Graphite framing, warm grey service panels, off-white lamp housings, steel details, black glazing seals, amber diffusers, restrained cyan guides. Emissive strips do not light nearby surfaces by themselves. Alpha-blended glass avoids expensive transmission. Materials use glTF-compatible values, not Blender-only procedural shaders.

## Measured export and checks

- 653,220 bytes (~638 KiB), 20 meshes/primitives, 9 materials, 9,144 triangles.
- Zero textures: no texture GPU allocation. Geometry and shader cost still exist; this is not an FPS benchmark.
- Reopened source blend successfully in Blender; parsed actual GLB with Three.js GLTFLoader. Checked finite vertices, floor/base bounds, length, overall height, transparent glass and no animations.
- Typecheck, lint, changed-file Prettier and production build passed; existing Game chunk-size warning remains.
- Playwright: isolated asset loading, expected measured statistics, inside/outside camera controls, roof/bounds toggles and orbit/zoom, with no browser errors. No screenshots or videos generated.

This is the first geometry/material prototype, not the reference's final photographic finish. Baked surface wear, grating normal maps, lighting polish and visual approval remain future work. Review in Blender or the development viewer before integration. The source is not automatically opened in the user's existing Blender window.

Regenerate from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background --factory-startup --python scripts/assets/build-panoramic-bay.py
```
