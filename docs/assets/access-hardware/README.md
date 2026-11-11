# Docking door and Crew Access — V1

## Current revision — V2

Verification now retains the existing 1.2-second card gesture, then waits 1.5
seconds before completing identity and requesting the bridge door. The focused
display shows a loading icon and verification status, never the profile early.
Reduced motion skips the hand animation and spinner rotation, but preserves the
1.5-second verification phase. Pause/hidden-page handling and the existing
completion callback remain authoritative; no second timer or identity state.

`docking-and-crew-v2.blend` preserves the V1 study. The aperture/glass center is
now Y=1.58 m, with lettering ordered top to bottom: DOCKING ACCESS (2.02 m),
window, ARRIVAL / DEPARTURE (1.22 m), PAMPA-07 (1.08 m). Current door export:
1,080,844 bytes, 20,000 triangles; Crew enclosure 339,508 bytes, 6,376 triangles.
The following V1 measurements remain the original integration record.

The runtime standby display now draws an ID-card symbol, scan instructions and
verified name/status on a dark screen. It uses the existing credential state and
portfolio name; the focused accessible identity UI remains unchanged. A single
704 × 512 canvas texture is recreated only when scan/verification state changes,
and disposed on cleanup. No per-frame drawing or new dependency.

V2 validation: typecheck, lint, build and targeted formatting passed; 12 unit/DOM
tests passed including actual rear-closure ray tests. Three native-input E2E
scenarios passed: arrival/identification/return, animated bulkhead collision and
reduced motion. No console errors or exceptions were recorded. Visual review of
the revised lettering, roof seam and standby screen remains with the owner.

Original meshes authored in the owner's live Blender from the approved visual
reference; no imported third-party meshes, textures or dependencies. This is an
initial detailed hard-surface pass, not a claim of photorealistic equivalence.
English lettering, graphite and warm-grey alloy, amber lamps and restrained cyan.

## Editable source

`docking-and-crew-v1.blend`, scene `Docking Door and Crew Access V1`.
Separate collections `CDS hardware / Docking door` and `CDS hardware / Crew Access`.
The previous arrival-room scenes remain intact. The terminal is displayed to the
right in the study; its exported coordinates are centered on its own mount.
`scripts/assets/build-access-hardware-live.py` creates this study once in live
Blender, exports evaluated temporary copies and leaves the source parts editable.
Export must use both `use_selection` and `use_active_scene`, to exclude selected
objects in other scenes. Static meshes are batched by material for runtime.

## Assets and placement

| Asset                                         |     Bytes | Triangles | Material batches | Bounds (metres)           |
| --------------------------------------------- | --------: | --------: | ---------------: | ------------------------- |
| `public/models/cruz-del-sur-docking-door.glb` | 1,084,324 |    20,064 |                8 | 2.85 W × 2.80 H × 0.294 D |
| `public/models/cruz-del-sur-crew-access.glb`  |   339,448 |     6,376 |                7 | 1.30 W × 1.12 H × 0.459 D |

No textures or animation clips. Both are Y-up, native metres, front +Z. Opaque
materials cull back faces; only the inspection glass is double-sided/transparent.

- Docking door: floor origin `[0,0,16.2]`, yaw π, facing the arrival room. Closed
  and noninteractive, as approved with interior spawn. A single conservative
  fixed box collider seals the rear route. Glass has a real aperture and shows
  the exterior, not a fabricated corridor. The previous procedural hatch is
  replaced; the bridge sliding GLB and its named leaf nodes are unchanged.
- Crew Access: existing `[2,1.65,12.37]`, yaw 0. Screen remains at local
  `[0,.03,.145]` for the existing physical HTML interface. The dynamic background
  at Z=.132 avoids the model backing at Z=.130. Reader feedback at
  `[0,-.48,.157]` stays aligned with the existing card gesture. Existing colliders,
  E interaction, identification timing and automatic bridge unlock are reused.

The original layout and UI are preserved. In particular the screen stays
landscape to fit the real identity UI, rather than copying a portrait concept
screen and making its content unreadable. Green verification feedback remains
runtime-driven. Cached GLBs are cloned once; only the owned transparent material
is disposed on unmount. No additional lights or postprocessing.

## Review

Validation: typecheck, lint, changed-file formatting, `git diff --check` and
production build passed (existing bundle-size warning retained). Vitest:
19 tests across asset bounds/budgets, identification, bulkhead, entry and arrival
layout passed. Playwright monitor: interior arrival/rear collision/credential/
return journey, detailed animated bulkhead collision, reduced motion and render
sampling all passed (4 scenarios). The detailed bulkhead also passed two serial
repetitions. Initial runs exposed native mouse settling failures; the test helper
now sends one native mouse move per correction instead of four interpolated moves.
No gameplay input, tolerances, timing assertions or state setters changed.

Short final 1280 × 720 Intel UHD D3D11 sample: median frame 13.9 ms, p95 14 ms,
median diagnostic snapshot 9.2 ms; 313 draw calls and 155,038 submitted triangles.
This is 24 stationary frame samples, not a long-duration performance guarantee.
Blender and other active GPU applications can affect these measurements.

Manual appearance review in Blender and Opera remains necessary: panel depth,
frame overlap with the existing rear wall, text scale, glass and amber brightness.
No automated screenshots or videos are generated. Fine surface wear and the
surrounding suit/storage props are not included in this focused pass.
