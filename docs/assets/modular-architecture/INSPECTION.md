# Modular architecture preview

Development URL: `/?architecture-preview` (run `npm run dev`). Select individual modules or their original assembled coordinates; orbit, pan, zoom, switch inside/outside and toggle roofs, reference props and bounds. This is a development-only inspection scene, not a replacement for gameplay.

## Measurements from the supplied GLBs

Dimensions include all mesh geometry, including protrusions and reference props; they are not usable interior clearance.

| Module  |  Bytes | X × Y × Z (m)          | Meshes | Triangles |
| ------- | -----: | ---------------------- | -----: | --------: |
| Entry   | 25,592 | 5.660 × 3.240 × 3.600  |     23 |     1,338 |
| Passage | 18,248 | 3.790 × 3.180 × 3.800  |     23 |       852 |
| Bridge  | 86,536 | 9.448 × 3.698 × 10.839 |     97 |     5,122 |

Each asset has one material, no embedded textures and no animation. Original transforms and proportions are preserved. Entry spans Z 3.2–6.8, passage approximately -0.1–3.7 and bridge -10.8–0.039; the entry junction overlaps. Source frames do not include actual glass. This kit does not directly match the approved six-metre gameplay passage and current interaction anchors. Production replacement requires a separate fit/clearance review.

Original binaries are in `src/dev/assets`. `README.source.md` preserves the supplied documentation. `scripts/assets/build-modular-architecture.py` preserves the supplied generator unchanged; it has not been executed. It requires numpy, trimesh and `/mnt/data/GLB format.zip`, which was not supplied. No dependencies were installed. No licensing information was added or inferred.

The dev entry point dynamically imports the preview only under `import.meta.env.DEV`. No navigation entry is added to the game. Visual proportions, materials and joining surfaces remain for manual review. Mesh/triangle counts do not establish runtime frame performance.
