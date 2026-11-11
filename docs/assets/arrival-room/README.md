# Arrival room — architectural study

Stage 1 only: proportions, circulation, faceted ceiling, port panoramic glazing,
bench, service cabinet, starboard technical storage and terminal reservation.
Created in the user's live Blender from the approved arrival-room reference.
Materials are provisional; no final textures, wear, props or door redesign.

- Source: `arrival-room-study.blend`; active scene `Arrival Room - Architectural Study`.
- Review export: `arrival-room-study.glb`, not loaded by the game.
- Reproduction: run `scripts/assets/build-arrival-room-live.py` in Blender. It creates
  a separate scene, preserves existing scenes, and refuses to duplicate the study.
- Coordinates: glTF X right, Y up, Z aft; floor Y=0. Suggested eventual world
  translation `[0, 0, 12.07]`. Blender uses `(x, -z, y)`.
- Floor footprint: 5.6 × 4.13 m; lateral wall thickness and furniture reduce usable space.
- Ceiling: approximately 3 m; sloped shoulders start at 2.45 m.
- Forward aperture: 2.68 × 2.50 m; existing bulkhead and sliding pockets remain
  separate, forward of the study origin. Rear docking aperture: 2.4 × 2.5 m at Z=4.13.
- Crew display reservation center: `[2, 1.72, 0.535]`; intentionally a blockout,
  not a functional terminal. Runtime screen remains `[2, 1.68, 12.515]`.
- Groups separate floor, walls, window, roof, furniture and access references.
  Hide the roof collection to inspect the plan. Exclude access references during
  eventual runtime integration to avoid duplicating the actual terminal.

The current application, colliders, door and gameplay are unchanged. Before integration,
review proportions with the owner, match the exact existing terminal mount and door
frame, and add simple furniture collision volumes. No app tests are implied by a model
preview. Source geometry and exported GLB are checked independently.

## Expanded V2 — window lounge and detail pass

Active source: `arrival-room-v2.blend`, scene `Arrival Room - Expanded V2`.
Review export: `arrival-room-v2.glb`. The original study is preserved.
Reproduce with `scripts/assets/detail-arrival-room-live.py` from a file containing
the original study. The script refuses to duplicate an existing V2 scene.

The port envelope bows outward up to 0.65 m at the midpoint of the room and
returns to its original endpoints. Floor edge, glazing, sills and roof follow
the expanded envelope; bench modules move outward without being stretched.
The center roof rises up to 0.38 m, with layered service panels, latches and vents.
Four floor plates are replaced by actual recessed grating assemblies: bars and
frames finish at Y=0, dark wells at Y=-0.023. No coplanar plate remains underneath.
Locker fronts and toe-kick lamps add a second furniture layer.

Export checked using Three.js: 291 meshes, 53,628 triangles, 8 materials,
2,574,760 bytes, one scene, finite vertices. Overall bounds including wall
thickness/exterior sill: approximately 6.72 × 3.72 × 4.38 m. These are asset
bounds, not usable interior dimensions. Live viewport inspected for floor and roof.

This remains an editable review model, not a runtime-optimized asset. Before
integration, batch static geometry/materials, adapt the enlarged hull collisions,
and recheck exact door/terminal clearance and ceiling joints. No application
files or interactions changed in this pass; application tests were not rerun.

## Finishes V3 — access surround and glazing seals

Active source: `arrival-room-v3.blend`, scene `Arrival Room - Finishes V3`.
Export: `arrival-room-v3.glb`. Reproduce with
`scripts/assets/finish-arrival-room-live.py` from the V2 source scene. Earlier
scenes, meshes and materials are preserved; V3 owns its material copies.

Adds a layered faceted portal, backing seals, removable inserts, recessed amber
lenses, base shoes and an English BRIDGE ACCESS sign. Glazing gaskets follow the
expanded V2 envelope. Starboard wall receives seams, service panels and skirting.
Initial glTF-compatible PBR colors/roughness distinguish graphite framing, warm
grey armor and ivory furniture; no final wear textures or extra lights.

Validated exported GLB: one scene, 393 meshes, 67,848 triangles, 8 materials,
3,298,276 bytes, finite mesh vertices and no unrelated scene objects. Inspected
the live Blender viewport. Overall bounds remain approximately 6.72 × 3.72 ×
4.38 m. This unbatched editable review asset is not a runtime performance target.
The actual sliding door and interactive terminal are still separate game assets.
No app code changed and no browser tests were run for this asset-only pass.

## Materials V4 — portable PBR texture pass

Source: `arrival-room-v4.blend`, active scene `Arrival Room - Materials V4`.
Export: `arrival-room-v4.glb`; generation script
`scripts/assets/materials-arrival-room-live.py` clones V3 without altering it.

Painted graphite, warm grey and ivory use subtle grain/scuff color maps and
packed roughness/metallic maps. Cushions have woven color and tangent-space
normal maps. Rubber remains matte; glass and emission retain their prior design.
World-scale per-face UVs provide approximately one texture repeat per metre.
This is initial surface variation, not baked curvature wear or final photorealism.

Eight 512 × 512 PNG images are packed in the blend and embedded in the GLB;
editable copies live in `textures-v4`. Estimated uncompressed RGBA8 GPU texture
storage with full mipmaps is 10.67 MiB, excluding geometry/framebuffers and driver
overhead. Export inspection confirms image dimensions, UVs and the standard glTF
base-color, metallic-roughness and normal texture bindings. Live viewport reviewed.
Geometry remains 393 meshes; batching and actual browser performance measurement
are still required before production integration. No app code changed or app tests
rerun for this material-only study.

## Runtime integration

`scripts/assets/export-arrival-runtime-live.py` exports a separate production
asset from the live V4 scene. Evaluated temporary copies are joined by material;
source meshes remain editable. The `Access references` collection is excluded,
so the existing interactive Crew Access remains the only terminal.

Runtime asset: `public/models/cruz-del-sur-arrival-room.glb`, 6,311,280 bytes,
7 material batches, 67,632 triangles and 8 embedded textures. The translation is
`[0, 0, 12.07]`, without rotation or scale distortion. The source blend and review
exports remain available for comparison. Production lights and colliders are
managed separately from this visual asset.

`EntryAirlock.tsx` replaces the receiving-room visuals and keeps the docking tunnel,
bulkhead pocket colliders and exposed threshold floors. The pocket's room-side
visual face is hidden to prevent coplanar overlap with the GLB facade. Actual Crew
Access, spawn, credential state and moving door are unchanged. `arrivalRoomLayout.ts`
uses fixed convex shell strips plus furniture boxes; no decorative triangle-mesh
physics. Two warm point lights (intensity 7, distance 5 m, no shadows) supply practical
fill alongside existing ambient lighting. Transparent glass uses a locally owned
material with depth writes disabled; cached GLTF resources remain shared.

Validation: typecheck, lint, production build and 16 relevant unit tests passed.
The default 1280 × 720 E2E runs failed at the initial waypoint due to native key
release/observation latency and overshoot (including a serial repeat). A separate
`playwright.arrival-validation.config.ts` retains real input and the same assertions
at 800 × 450. The arrival/bench/credential/door/return/reload scenario passed there.
This does not establish a passing default-resolution baseline or hardware fluency.

The detailed bulkhead scenario initially exceeded its 180-second total budget.
The dedicated low-pixel-load config marks that scenario slow, without changing
the default suite or individual interaction assertions. The walking helper also
now recomputes distance from the stopped final pose on deadline, correcting a
stale-distance failure observed when the actual position was already on target.
The final detailed-bulkhead retry still failed a waypoint at world Z=13.3
(observed Z=13.889 versus 0.3 m tolerance). That scenario is NOT passing; only
the full arrival journey passed at 800 × 450. Its larger time budget did not
resolve native-input timing instability. Manual hardware review and follow-up
performance/test investigation remain necessary.

800 × 450 headless samples: arrival 304 draw calls, 132,990 triangles, 247 geometries,
14 textures, 19 programs, 369 ms sampled frame; bridge 127 calls, 38,212 triangles,
248 geometries, 14 textures, 19 programs, 112 ms. These are individual observations,
not a frame-time distribution or controlled before/after benchmark. Owner review of
lighting, material appearance, joints and actual-browser frame rate remains pending.
