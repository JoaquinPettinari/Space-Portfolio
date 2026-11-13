# Industrial bridge interior

## Current editable sources — consolidated

- `bridge-interior-final.blend`: finished Blender-only bridge, one scene.
- `bridge-interior-backup.blend`: compact rollback before final finishing.
- `bridge-interior-v13.blend`: source retained for the currently deployed GLB.

The final scene includes closed lower hull walls, refined seats, material and
preview-light studies, hull service panels, console cable channels and tactical
grip insets. Original vertices, transforms and interaction metadata were checked
unchanged during the finishing pass. All seven textures are packed. Four area
lights are preview-only and must be excluded from future runtime exports.
The final file was reopened and checked: one scene, 1,581 meshes and four lights.
No runtime asset or application changes were made for this pass; visual and
browser validation after integration remain pending.

Twenty intermediate/temporary Blend files were removed (120,623,557 bytes).
Older version entries below are historical records; their separate files are no
longer retained. Generation scripts remain as history, not a standalone rebuild
pipeline: several require the historical scenes. Work forward from the final
source. Deleting working-tree files does not shrink existing Git history.

## Ergonomic seats V18 — Blender review only

Source: `bridge-interior-v18-seats.blend`, scene `Bridge - Ergonomic Seats V18`.
Script: `scripts/assets/refine-seats-v18-live.py`.
Four seats retain their anchors, shell and arms, with segmented cushions,
head cushions, adjustment details and five radial feet with twin casters.
Vertex checks after a view-layer update passed for the existing 0.84 m square
and 1.30 m high seat envelopes. Other object transforms and metadata were
asserted unchanged. V17 walls and preview lighting remain. Initial checks ran
before updated beam matrices; the script now updates before verifying.
Blender could not replace the initial V18 filename; the completed scene was
saved successfully under the distinct `v18-seats` filename above.
No runtime export or browser tests; visual and runtime validation remain pending.

## Lower console walls V17 — Blender review only

Source: `bridge-interior-v17.blend`, scene `Bridge - Closed Console Walls V17`.
Script: `scripts/assets/close-bridge-walls-v17-live.py`.
Seven mitered lower hull segments follow the existing outline with its baked
-3.15 m longitudinal offset. Walls extend from -0.06 to 0.80 m in height,
16 cm outward from the existing perimeter. Two lateral sill sections complete
the five existing bow sills. The upper panoramic openings remain unobstructed.
No existing furniture, monitor, geometry or interaction metadata was changed.
63 mesh ray checks verified coverage at three positions and three heights on
each segment; assertions also compared all original vertices and transforms.
V16 and its preview lighting are preserved. No runtime export, collider or app
changes; integration must check the new shell against existing runtime hull
visuals before export. Browser tests were not rerun. Visual review is pending.

## Lighting study V16 — Blender review only

Source: `bridge-interior-v16.blend`, scene `Bridge - Lighting Study V16`.
Reproduce from V15 with `scripts/assets/light-bridge-v16-live.py`.
Four broad area lights approximate two warm ceiling banks, the entry ceiling and
cool bow daylight. A copied world provides subdued ambient illumination. Lights
live in `PREVIEW ONLY / V16 lighting - exclude from GLB` and carry `preview_only`.
They are an art-direction study, not a measured or exportable Three.js lighting
setup. No runtime lighting, shadows or GLB changes were made.
Assertions verified all 1,323 mesh vertex positions, transforms and object metadata
against V15. Materials remain unchanged. Blender viewport uses rendered shading
for manual inspection; no captures generated. App tests were not rerun because
runtime files were unchanged. Visual approval and runtime light tuning remain pending.

## Material study V15 — Blender review only

Source: `bridge-interior-v15.blend`, scene `Bridge - Material Study V15`.
Reproduce from V14 with `scripts/assets/finish-bridge-v15-live.py`.
Darker graphite, subdued off-white panels and brushed metal retain six materials
and seven packed 512px image maps. Lower-frequency, low-amplitude normal detail
reduces high-frequency surface detail; actual browser shimmer remains untested.
Warm amber emission and restrained cyan are material adjustments, not additional
scene lights. Blender preview lighting does not establish runtime illumination.
All 1,323 meshes, vertex positions, transforms and object metadata were asserted
unchanged. V14 materials remain independent, and its lamp separation is preserved.
No GLB export or application change in this iteration. No application checks were
rerun; manual Blender review and subsequent runtime integration are pending.

## Ceiling lamp correction V14 — Blender review only

Source: `bridge-interior-v14.blend`, scene `Bridge - Ceiling Lamp Fix V14`.
Reproduce from V13 with `scripts/assets/fix-entry-lamps-v14-live.py`.
The selected entry diffuser and all five matching lamps shared the same 3.04 m
underside plane with solid housing faces. Housing bottoms now start at 3.06 m;
diffusers remain at 3.04..3.052 m. Assertions verified all six pairs, leaving
8 mm separation and retaining the existing ceiling clearance. V13 is preserved.
No runtime export or app code changes: the user now reviews visual edits in
Blender before integration. App flicker verification remains pending after export;
no application tests were rerun for this source-only adjustment.

## Matching outer entry niches V13

Current source: `bridge-interior-v13.blend`, scene `Bridge - Matching Entry Niches V13`.
Reproduce from V12 with `scripts/assets/match-entry-niches-v13-live.py`.
The user selected `Entry outer panel.015` and requested the matching opposite
panel to be treated like its neighbour. Both full-height Ivory panels are replaced
by copies of their adjacent recess assemblies, widened from 1.16 to 1.66 m.
Centres remain X=±3.97, world Z=1.95. Dark recessed backs, metal upper/lower panels,
edge liners and warm strips preserve the closed wall volume. Runtime colliders,
entry clearance, computers and other furniture are unchanged. V12 remains intact.
Exported-asset ray checks now cover both new recess backs as well as the originals.
This is the selected-panel correction; the broader texture/lighting pass remains pending.
Validation: typecheck, lint, formatting, two exported-asset tests, build and the
native transition/table E2E passed. No console errors; existing deprecation and
large-chunk warnings remain. Visual review is manual; no captures generated.

## Manufactured console monitors V12

Current source: `bridge-interior-v12.blend`, scene `Bridge - Console Monitors V12`.
Reproduce from V11 with `scripts/assets/detail-console-monitors-v12-live.py`.
Four monitor shells add faceted rear shrouds, machined bezels, dark seals,
recessed status lamps, captive screws, bezel keys, rear ventilation and feet.
Small raised key banks flank the existing console keyboards. These decorative
keys trigger the same computer interaction, not separate unimplemented actions.

Workstation and WallTerminal retain their live idle-label meshes, highlight tint,
colliders and all HTML/focus anchors. Their old rectangular frame/stand/key meshes
are removed to avoid duplicate surfaces. Blender shells export their respective
computer/communications/personal/arcade interaction metadata. Source V11 remains.
Tests check all four display apertures at centre, edges and corners, as well as
the per-monitor interaction metadata. No UI layouts or application content changed.

GLB: 10,822,428 bytes, 126,388 triangles, 21 batches / six materials. Twelve new
monitor batches replace the procedural frame meshes; total scene draw-call or
frame-time improvements are not inferred from these asset counts. No new lights,
textures or dependencies. Final material/fit inspection is manual; no captures.

Typecheck, lint, formatting, diff checks, ten relevant unit tests and build passed.
Existing build chunk and Blender sampler warnings remain.
All four targeted native E2E scenarios passed across the initial run and a repeat:
Archive/CV, Communications with mocked delivery, Personal Workstation and
Recreation commands/puzzle, including capture restoration. The first run failed
Communications and Personal during native mouse settling in the arrival room
before reaching the consoles. Both passed unchanged on repeat; this input-test
intermittency remains recorded rather than treated as a clean first run. No
console errors; existing Three.Clock/Rapier deprecation warnings remain.

## Faceted tactical table V11

Current source: `bridge-interior-v11.blend`, scene `Bridge - Tactical Table V11`.
Reproduce from V10 with `scripts/assets/detail-tactical-table-v11-live.py`.
The source clones the current V10 scene, preserves other furniture, removes the
previous tactical fittings and replaces them with a faceted plinth, tapered
pedestal, shoulder, open layered bezel, service panels, ribs, vents and amber
diffusers. Earlier sources remain available.

`Greybox.tsx` removes only the old rectangular pedestal and solid top block.
The existing live display, cyan guides, ring, hologram and physical interaction
screen remain unchanged, as do the table anchor and collider. The bezel aperture
is 1.826 x 2.426 m around the existing 1.8 x 2.4 m display; the frame does not
cover its corners. All new pieces retain exported `interaction: tactical` extras.
No new input modes, lights, textures or dependencies.

GLB: 9,447,188 bytes, 106,756 triangles, nine batches / six materials.
Typecheck, lint, formatting, diff checks, 12 relevant unit tests and build passed.
Asset ray checks cover the complete display aperture, including its corners.
Existing build-size and Blender sampler warnings remain. Final visual quality,
joint appearance and moving-view flicker are for manual review; no captures made.
Two native E2E scenarios passed: transition traversal/table E interaction and
tactical sections, inspection controls and return to FPS with real Pointer Lock.
No console errors; existing Three.Clock/Rapier warnings remain. One tactical
render observation reported 71 calls, 107,320 triangles and 17.2 ms frame time;
this is a single host sample, not a sustained performance guarantee.

## Perimeter desks and four computers V10

Current source: `bridge-interior-v10.blend`, scene `Bridge - Perimeter Desks V10`.
Run `node scripts/assets/export-bridge-layout.mjs` then
`scripts/assets/build-perimeter-desks-v10-live.py` from V9 in Blender.
Source dimensions come from `commandLayout.ts` and exported `layout.json`.

Seven mitered countertop segments form a continuous U around the bow and both
sides, ending at local Z=3.0 to preserve the rear entrance and existing extras.
Side bends begin at Z=-0.4 so the outer desk corners remain inside the hull.
Four knee bays are 1.10 m wide, clear below Y=0.94; cabinet meshes and support
colliders are split on the same planes. Countertop colliders occupy Y=0.94..1.04.
The old solid Personal Workstation block is removed. Four Blender chairs share
the V9 design; the original forward screen/chair anchors are preserved.

Archive and Communications remain forward. Personal Workstation retains its
starboard screen anchor. The port Recreation Terminal is at world
(-4.205, 1.68, -2.75), facing +X, with chair at (-3.2, 0, -2.75).
It reuses physical-screen focusing, input modes, exit/capture and the existing
command terminal. Signal Puzzle is a small optional local game with four paired
switches and reset, unrelated to missions/power. More minigames are future work.
The original personal desktop/CV and command application remain available.

GLB: 9,185,940 bytes, 102,980 triangles, nine batches / six materials. Side screen
labels use small disposable CanvasTextures. No new dependencies or lights.
Earlier sources remain. No automatic captures; final appearance is reviewed manually.

Validation: typecheck, lint, production build, changed-file formatting and diff
checks passed. Full unit suite: 49 files / 188 tests; eight station tests rerun
after adding the new terminal to camera-fit/HTML-scale cases. Four targeted native
E2E scenarios passed for Archive/CV, Communications (mock delivery), Personal
Workstation and Recreation Terminal (commands, puzzle, layout fit, Pointer Lock).
The first geometry check exposed a side desk corner crossing the hull; moving the
side bend to -0.4 corrected it before the final export. Full legacy E2E is not
claimed. Existing large-chunk, Three.Clock/Rapier and export sampler warnings remain.

## Command seats V9

Current source: `bridge-interior-v9.blend`, scene `Bridge - Command Seats V9`.
Reproduce from V8 with `scripts/assets/detail-command-seats-v9-live.py`.
Both seats use the exported command-chair anchors plus the existing bridge offset.
The simple React chair meshes were removed from `Workstation.tsx`; their fixed
bodies and colliders are unchanged. Blender supplies faceted shoulder shells,
separate lumbar/upper cushions, padded armrests, lift pistons, braced feet,
rear service panels and small amber markers. No sitting interaction is added.

Measured local bounds: X approximately -0.415..0.415 m, Y 0.01..1.28 m,
Z -0.385..0.418 m. These stay inside the original 0.84 x 1.30 x 0.84 m
collision envelope; the low back preserves the monitor sightline.
GLB: 9,528,912 bytes, 107,404 triangles, nine batches / six materials. No
additional batches, textures, lights or dependencies compared with V8.
Earlier source files remain available. Visual fit and upholstery are for manual review.

Typecheck, lint, changed-file format, diff checks, six relevant unit tests and
production build passed. Existing build chunk and texture-sampler warnings remain.
Two native Playwright scenarios passed: physical Communications (Skip, validation,
mocked accepted retry) and Archive (records, CV download, real Pointer Lock exit).
No console errors; existing Three.Clock/Rapier warnings remain. No captures generated.

## Console and tactical furniture V8

Current source: `bridge-interior-v8.blend`, scene `Bridge - Furniture Details V8`.
Reproduce from V7 with `scripts/assets/detail-bridge-furniture-v8-live.py`.
Earlier Blender sources remain intact.

Added low-profile console key banks, service grilles, captive fixings and amber
indicators. The tactical pedestal gains metal service panels, recessed inserts,
side vents, amber plinth strips and rim protection. Existing React tabletop,
screens, hologram, camera anchors, physics and input logic remain unchanged.
These are decorative fittings, not new functional switches.

Table fittings export with `extras.interaction = tactical`. Export batches are
split by both material and interaction so their surfaces retain E interaction
without tagging room geometry as tactical. Regression checks verify this metadata
and unobstructed monitor focus rays. The table remains within its existing X/Z
collider footprint; added rim pieces stay outside the existing display surface.

GLB: 9,040,944 bytes, 100,596 triangles, nine mesh batches and six materials.
Compared with V7 this adds three table batches and about 1.05 MB. No new textures,
real-time lights or dependencies. Frame-time performance is not inferred from
these counts. Appearance and close-up joins still require manual visual review.

Typecheck, lint, four relevant unit tests and production build passed. Existing
large-chunk and Blender texture-sampler warnings remain.
Changed-file formatting and diff checks passed. Two native Playwright scenarios
passed: Crew Access/door and transition round trip with tactical inspection;
physical Archive records, CV download and real Pointer Lock restoration.
No console errors were recorded; existing Three.Clock/Rapier warnings remain.
No screenshots or videos were generated.

## Finished entry transition V7

Current source: `bridge-interior-v7.blend`, scene `Bridge - Finished Entry V7`.
Reproduce from V6 with `scripts/assets/detail-transition-v7-live.py`.
Previous sources remain available. The runtime GLB includes the bridge offset.

The existing three-metre transition now has segmented graphite panels, recessed
amber floor guides, transverse ceiling beams, light cassettes and niche trim.
Niches remain empty. The clear three-metre width and ceiling underside at Y=3.04
are preserved; interactions, collision definitions and bridge furniture are unchanged.
Floor panels and guides occupy separate bands above recessed backing, avoiding
competing coplanar surfaces. Appearance and flicker during movement require manual review.

GLB: 7,994,768 bytes, 85,692 triangles, six meshes/material batches. No additional
textures or real-time lights. Geometry increased from V6; these counts alone do
not establish frame-time performance.

Validation: typecheck, lint, four relevant unit tests, changed-test formatting and
production build passed. The build retains its existing large-chunk warning.
Two native Playwright scenarios also passed: arrival credential/door flow,
transition round trip and side collision, tactical inspection, and physical
Archive records/CV/Pointer Lock restoration. No console errors were recorded;
existing Three.Clock and Rapier deprecation warnings remain. No captures were made.

## Clear three-metre transition V6

Current source: `bridge-interior-v6.blend`, scene
`Bridge - Clear Three Metre Entry V6`. Reproduce using
`scripts/assets/extend-bridge-transition-v6-live.py` from V5.

The previous transition intruded into the bridge footprint. A 1.5 m translation
alone would retain that overlap, so the whole bridge now moves -3.15 m along Z.
Its rear plane is Z=1.95 (facade outer face 2.10). The clear solid transition
occupies Z=2.10..5.10, exactly 3 m before the unchanged glass passage.
The continuous threshold deck joins the main floor at Z=1.95 without overlapping.
Side colliders remain simple boxes; recessed niches do not affect walking.

`bridgePlacement.ts` is the runtime translation contract. Hull, roof, lighting,
console colliders, chairs, tactical table, CV panel, coffee, photos and monitors
move together. Focus poses and HTML screens use translated world anchors; room
geometry and command footprints retain their original local coordinates. The
Blender GLB contains the world translation already and must not be shifted again.
Spawn, docking, Crew Access, bulkhead and glass passage remain fixed. DeckMap and
E2E bridge waypoints follow the same translation. Earlier Blender files remain.

GLB: 7,072,408 bytes, 72,720 triangles, six material batches. Targeted native E2E
passed for Archive/CV/Pointer Lock, quick access, Communications, coffee/photo,
Personal Workstation, tactical inspection and transition round trip/side collision.
The mouse helper retains its angular tolerance but allows 12 bounded corrections
with an 80 ms delivery wait. The tactical test re-aims after approaching instead
of keeping a distant fixed pitch that hits beyond interaction range. No gameplay
input rules were changed. Older station/workstation E2E still contain pre-existing
power/airlock expectations; the complete legacy E2E suite is not claimed passing.
Manual visual inspection of joints and proportions remains required.
Final unit run: 48 files / 186 tests passed. Typecheck, lint and changed-file
formatting passed; seven targeted native E2E scenarios passed after the test
waypoint/selector/input-delivery corrections described above.

## Solid transition V5

Current source: `bridge-interior-v5.blend`, scene `Bridge - Solid Transition V5`.
Reproduce using `scripts/assets/build-bridge-transition-v5-live.py` from V4.
The sequence is docking access, glazed passage, solid transition, main bridge.
The transition occupies Z 3.45–4.95 inside the rear bridge footprint: 1.5 m long,
3 m clear width between straight walls, ceiling underside Y 3.04. The existing
2.68 m passage mouth remains unchanged. Side niches face inward and stay empty.
BridgeInterior adds simple side/ceiling colliders within its existing fixed body.
Bridge stations, table, spawn and passage are not moved. Panels and grille slats
now reuse the darker Graphite material; guides retain their amber emission.

Nine relevant unit tests, two native Playwright scenarios (Archive/CV/Pointer Lock
and Communications), formatting, typecheck, lint and build passed. Tests check the central
route and recessed side backs in the exported asset. Visual review of the reveal
and the darker deck remains manual.

## Industrial deck V4

Current Blender source: `bridge-interior-v4.blend`, scene
`Bridge - Industrial Deck V4`. Reproduce with
`scripts/assets/build-bridge-floor-v4-live.py` from V3. Earlier sources remain.

The deck follows the actual convex bridge outline. Panels finish at Y=0;
grille slats at -0.006 m, amber guides at -0.008 m, backing at -0.065 m.
Panels are clipped around dedicated grille/light bands, with separated seams.
BridgeFloor now supplies only the unchanged continuous walking collider: there
is no procedural floor surface competing with the GLB. Grille gaps are visual,
not holes in the physics floor. No additional lights, textures or interactions.

Runtime GLB: 6,665,140 bytes, 69,792 triangles, six material batches. Asset ray
tests cover flush panels, recessed guides, grille gaps and monitor/entry clearance.
Manual review while moving is still required for distant grille aliasing and
material shimmer; geometry separation addresses coplanar z-fighting specifically.

V4 validation: typecheck, lint, changed-file formatting, nine unit tests, build
and three E2E scenarios passed (Archive/CV/native Pointer Lock, Communications,
roof measurement). No console errors; existing deprecation/build warnings remain.
The first timing sample overlapped other checks (54.3 ms median). A standalone
repeat measured 27.3 ms median / 32.6 ms p95, 118 draw calls, 107,244 rendered
triangles and 20 textures on Intel UHD at 1280×720. This is slower than the earlier
V2 sample; no controlled attribution or sustained frame-rate guarantee is made.

## Recessed entry V3

Current source: `bridge-interior-v3.blend`, scene `Bridge - Recessed Entry V3`.
Run `scripts/assets/build-bridge-entry-v3-live.py` with V2 loaded to reproduce.
The rear facade replaces the procedural plates in ShipHull; its Greybox colliders
remain unchanged. All parts stay inside the previous wall envelope (Z 4.95–5.25,
Y 0–3.3), preserving the 2.68 m entrance width and existing passage connection.
Two empty niches face the arriving visitor (+Z), centered at X ±2.56, Y 1.57.
Their lined cavity is approximately 1×1.54×0.2 m; future decorations must fit
within this shallow recess. No shelves, props or new interactions are introduced.

The GLB now contains 55,836 triangles and weighs 5,608,688 bytes; it retains six
material batches and the V2 textures. Added asset tests verify unobstructed
entrance rays and genuinely recessed backs, alongside monitor clearance tests.
Visual similarity and niche visibility from oblique angles need manual review.

## Surface finishes V2

Current editable source: `bridge-interior-v2.blend`, scene
`Bridge - Surface Finishes V2`. V1 is preserved for comparison. Run
`scripts/assets/texture-bridge-v2-live.py` with V1 loaded to reproduce this pass;
it refuses to overwrite an existing V2 scene.

Painted graphite, ivory panels and brushed metal now use embedded color,
metallic/roughness and subtle normal maps. Planar UVs repeat once per metre.
Small console fasteners, service plates and counter seams remain editable.
No monitor, interaction anchor, collider or runtime light changes are needed.

Current GLB: 5,283,644 bytes, 51,192 triangles, six material batches and seven
512×512 PNG images. Estimated uncompressed RGBA texture storage including mipmaps
is 9.33 MiB if shared images are uploaded once; this is not total GPU memory.
Three material slots reference the shared normal image. Textures are also saved
under `textures-v2/` and packed into the Blender source.

Typecheck, lint, ten relevant unit tests and production build passed for V2.
All four targeted Playwright scenarios also passed (physical Archive with CV and
native Pointer Lock, quick access, Communications and roof measurement). The V2
sample reports 119 draw calls, 88,672 rendered triangles, 20 textures, median
13.1 ms and p95 15.7 ms over 90 frames on Intel UHD / Chromium at 1280×720.
Timing varies between runs: this does not establish a performance improvement
over V1. Existing deprecation and build chunk-size warnings remain.
Manual review of texture appearance, reflections and small-scale shimmer remains
necessary; automated tests do not establish visual similarity to the reference.

## Previous structural pass V1

Editable Blender scene: `Bridge - Industrial Interior V1`, saved in
`bridge-interior-v1.blend`. Runtime asset:
`public/models/cruz-del-sur-bridge-interior.glb` (2,122,864 bytes, 39,204 triangles,
six material batches, no textures, lights, cameras or animation).

This first pass follows the approved industrial reference with layered ceiling
cassettes, ventilation, warm diffusers, window seals/armor and continuous ivory
console tops over graphite bases. Auxiliary instruments and keys are decorative.
It is not a final textured reproduction of the concept image.

## Reproduction

1. Run `node scripts/assets/export-bridge-layout.mjs` from the repository root.
   This exports the actual TypeScript roof panels, console footprints and monitor
   anchors into `layout.json`; no coordinates are independently guessed.
2. Run `scripts/assets/build-bridge-interior-live.py` in live Blender. It creates a
   new scene, preserves existing arrival scenes, and refuses to overwrite itself.
3. The source keeps individual parts. Evaluated temporary copies are grouped by
   material for the GLB, then removed; no destructive joining of source objects.

Coordinates are game metres, X right, Y up, Z aft; Blender uses `(x,-z,y)`.
The asset is placed at the world origin, once, in `BridgeInterior`.
`Workstation` retains its original colliders, chairs, monitor labels, physical
screen meshes, interaction targets and React interfaces. Only the console body
visuals are replaced. `BridgeRoof` retains panels and collisions; its old frame
instances are replaced by the GLB roof frames. Existing hull skin remains behind
the thicker window trim, without coplanar overlay faces.

No room footprint, screen focus pose, Pointer Lock code or professional content
changes. No extra runtime lights or shadows. Roof undersides stay within the
existing collision margin. Remaining work includes manually reviewing material
appearance and proportions, then adding surface textures and more bespoke props
incrementally. No screenshots or videos are generated by the validation workflow.

## Validation

Typecheck, lint, build and changed-file formatting passed. Ten relevant unit tests
cover layout anchors and unobstructed monitor focus rays through the exported GLB.
Four Playwright scenarios passed: Communications validation/Skip/mock retry,
Archive reading/CV/Pointer Lock, Quick Portfolio Access and roof measurement.
The Archive return test now waits for X/Y to settle using its existing precision,
rather than reading them as soon as Z reaches its looser threshold.

Short Intel UHD / Chromium sample at 1280×720: 119 draw calls, 76,684 rendered
triangles, median 18.7 ms and p95 29.8 ms. This is not a sustained frame-rate
guarantee. No console errors in these scenarios; existing deprecation warnings
and the large production chunk warning remain.
