# Arrival room — architectural study

## V10 — larger footprint, human-scale fittings

Latest source: `arrival-room-v10.blend`, scene `Arrival Room - Spacious V10`.
Reproduction: run `scripts/assets/expand-arrival-v10-live.py` after V9.
Main envelope is 8.4 × 6.195 m (formerly 5.6 × 4.13 m); the curved port extension
also scales in plan. Heights remain unchanged. Architecture expands 1.5× in X/Z;
furniture is relocated, with the existing bench fitted to the new curvature.
An additional 60 mm inward bench allowance clears the scaled wall/ribs.
Coffee supplies, photographs, cabinets and Crew Access remain human-sized.

The front portal, bulkhead and reader keep their positions. End-wall adapter
panels seal around original-sized doors. Docking hatch world Z is now 18.265 m;
spawn is `[0,1,17.065]`, still facing forward. Shell/furniture colliders and the
tablet map match the enlarged room. Two existing practical lights are repositioned;
no new lights, textures or interaction state. The bridge geometry is unchanged.

Validation: nine relevant unit tests passed, including exported floor/roof rays
outside the old footprint, doorway seals and human-scale fittings. Four E2E
scenarios passed (arrival/bench/identity/return/reload, door collision, reduced
motion and performance); the arrival scenario passed again after the final
bench fitting adjustment. The short 1280×720 Intel UHD sample measured median
14 ms / p95 21 ms; this does not establish sustained performance. Visual review
remains manual. Previous Blender versions are retained.

## V9 — coffee supplies and personal memory mounts

Latest source: `arrival-room-v9.blend`, scene `Arrival Room - Coffee and Memories V9`.
Reproduce after V8 with `scripts/assets/detail-arrival-v9-live.py`.
The arrival cabinet now has shelves, canisters, a flask, hollow mugs, a slotted
tray and a restrained emissive shelf light. No additional real lights/colliders.
The existing interactive coffee dispenser and project photo remain in the bridge;
the arrival additions are decorative and do not duplicate their interaction state.

Three empty photo inserts are ready for owner-supplied images:

| Blender object         | Material / exported batch identifier | Image aspect ratio |
| ---------------------- | ------------------------------------ | ------------------ |
| `ARR9 MEMORY_PHOTO_01` | `ARRIVAL_MEMORY_01`                  | 4:3                |
| `ARR9 MEMORY_PHOTO_02` | `ARRIVAL_MEMORY_02`                  | 3:4                |
| `ARR9 MEMORY_PHOTO_03` | `ARRIVAL_MEMORY_03`                  | 25:18              |

Each insert has independent material and full 0..1 UVs. Later, assign an sRGB
Image Texture to its Principled Base Color in Blender and re-export; crop to
the listed ratio to avoid distortion. No personal photos or fictional biographies
were added. Frames remain separate from replaceable image surfaces, and runtime
material batching preserves the three slot identifiers.
Runtime GLB: 9,435,440 bytes, 15 material batches. Existing eight embedded images
are reused; photo slots do not allocate image textures yet. Original V8 retained.

Validation: typecheck, lint, build, changed-file formatting and six relevant unit
tests passed. Playwright passed the arrival/identity/door/return scenario and the
coffee/drink/photo/zoom/exit scenario with guidance skipped. The extras test now
uses the current HUD labels and expects the approved automatic Pointer Lock
restoration on photo exit. Visual review remains manual, with no screenshots or
videos generated. The existing large-bundle build warning remains.

## V8 — fitted lounge and mounted details

Latest editable source: `arrival-room-v8.blend`, scene `Arrival Room - Fitted Lounge V8`.
Run `scripts/assets/detail-arrival-v8-live.py` after V7 to reproduce. Previous scenes
and files are preserved. The runtime export remains `cruz-del-sur-arrival-room.glb`.

- Continuous curved bench base, fitted cushions, inclined backs, piping, recessed
  locker fronts/pulls, vents and a warm emissive toe strip. No additional lights.
- The entire bench follows the hull, with a 30 mm inward fitting allowance;
  evaluated mesh rays measured a minimum 17 mm lateral glazing/frame clearance.
  Twelve short box colliders replace the old three straight furniture boxes.
- Medical kit moved clear of the window rib onto a solid wall bracket, with its
  cross, label and latch exposed. Four front-corner visibility rays checked.
- Argentine enamel flag: equal sky-blue/white/sky-blue stripes, untextured white,
  golden sun with 32 alternating rays and small facial details. Separate mounting
  bracket and frame; exported visibility tests catch occluding objects.
- Runtime asset: 8,882,840 bytes, 85,999 triangles, 12 material batches and eight
  embedded images. No new image textures or external dependencies.

Validation: seven relevant unit tests, typecheck, lint and build passed. Actual
GLB tests cover the flag material, fixture visibility and existing doorway seals.
Four Playwright scenarios passed: arrival/bench/identity/return/reload, sliding
door collisions, reduced-motion passage and the render-cost sample. No console
errors; existing Three Clock and Rapier deprecation warnings remain.
1280 × 720 Chromium / Intel UHD sample: median 13.9 ms, p95 20.8 ms, 318 draw calls.
This is a short automated sample, not a sustained frame-rate guarantee. Visual
review of upholstery, flag appearance under lighting and fittings is manual;
no screenshots/videos were recorded.

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

Latest detail pass: `arrival-room-v6.blend`, scene `Arrival Room - Equipment
Details V6`, created by `detail-arrival-v6-live.py`. Adds shallow cabinet vents,
hinges and pulls, a bench equipment case, first-aid cabinet and small Argentina
plaque. The case stays inside the existing bench collision footprint; no new
walkway props, missions or interactions. V5 and earlier scenes are retained.
Runtime GLB: 7,750,384 bytes, 72,744 triangles, nine material batches and the same
eight embedded textures. Door/reader transforms and the V5 roof closure remain.

V6 validation: typecheck, lint, targeted formatting, production build and 11
unit/DOM tests passed. Four browser scenarios passed, including verification
loading before identity/unlock, collision/return, reduced motion and profiling.
Short Intel UHD D3D11 1280 × 720 sample: median 13.9 ms, p95 20.9 ms (24 stationary
frames; not a sustained FPS guarantee). No screenshots/videos generated. Owner
visual review of the new equipment and labels remains pending.

Current closure revision: `arrival-room-v5.blend`, scene `Arrival Room - Rear
Closure V5`. The rear header was extended from Y=3.10 to 3.50 m to overlap the
vaulted roof (center ~3.38 m), closing the visible sky gap. V4 is preserved.
Runtime export is 6,310,432 bytes; placement, floor, furniture and interactions
are unchanged. `refine-arrival-access-live.py` records the live Blender revision.
`arrivalRearClosure.test.ts` casts rays through the actual exported mesh where
the gap previously existed; visual review remains manual.

`scripts/assets/export-arrival-runtime-live.py` exports a separate production
asset from the live V4 scene. Evaluated temporary copies are joined by material;
source meshes remain editable. The `Access references` collection is excluded,
so the existing interactive Crew Access remains the only terminal.

Runtime asset: `public/models/cruz-del-sur-arrival-room.glb`, 6,310,444 bytes,
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

### Performance follow-up

See [PERFORMANCE.md](./PERFORMANCE.md) for the controlled renderer comparison,
normal/culling correction and current validation. Full Chromium modern headless
uses the available GPU on the development machine; the previous Headless Shell
used SwiftShader. The arrival-validation configuration now shares the standard
1280 × 720 resolution and budgets. The following notes preserve the original
integration investigation and do not describe the current test configuration.

### Historical integration validation

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

### V7 — bench clearance and front portal closure

Source: `arrival-room-v7.blend`, scene `Arrival Room - Bench and Portal V7`.
Reproduce after V6 with `scripts/assets/refine-arrival-v7-live.py`.
The window plinth now follows the same twelve curved longitudinal segments as
its collider instead of intersecting the seating area. Existing seat positions,
colliders and all interactions are retained. The front header reaches 3.5 m;
a graphite overhead reveal closes the frame-to-room joint, with its underside
at 2.53 m above the 2.50 m moving leaves. No changes to door mechanics.
Runtime GLB: 7,756,900 bytes, nine material batches (+6,516 bytes over V6).
Actual-export ray tests cover seat clearance and both upper portal seals.
Owner review of seat appearance and the reported doorway viewing angle remains
necessary; no screenshots or videos were generated.
