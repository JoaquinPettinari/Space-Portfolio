# Exploration bridge — Stage 5: restrained trim and measured roof batching

## Gameplay changes

The 45 existing roof-frame boxes and four existing warm practical strips are rendered in two static instance batches. Endpoints, 12 cm frame section, strip positions, colours and material parameters are preserved. Transparent panels remain separate for their existing sorting, and all Rapier canopy colliders are unchanged.

`roofFrameLayout.ts` derives matrices from the shared roof-panel edges. `RoofFrames.tsx` uploads them once, computes aggregate culling bounds and shares one geometry/material per batch. No per-frame allocations, listeners or React state were added. Fiber owns/disposes the instance meshes, geometries and materials; no unmanaged global Three.js resources are created. The instance transforms total 49 × 64 = 3,136 bytes before driver overhead.

One small physical plate above the rear bridge opening reads CRUZ DEL SUR / CDS-01 / OBSERVATION DECK. It uses existing graphite, off-white and amber tones, a 512×64 canvas texture and a 2×0.25 m plane. RGBA8 with mipmaps is approximately 0.167 MiB, excluding driver overhead. It has no interaction, no collider and no real light. Its texture is disposed on unmount. No new asset download or dependency.

No changes to the UI, missions, terminals, camera controls, collisions, atmospheric lighting, bridge layout or source GLBs. This is live gameplay geometry, not the development asset preview.

## Measurement method

`e2e/roof-performance.spec.ts` uses native input to enter the bridge and look toward (0,3.2,-6), then waits 30 frames and samples 90. Viewport 1280×720, DPR 1, reduced motion, Vite development mode. Actual camera pose, render calls, triangles, frame time and resource counts are recorded. GPU counters come from Three.js renderer.info; geometry/texture counts are not byte-accurate VRAM estimates. Diagnostics remain development/test-only and read-only.

Renderer: ANGLE / Vulkan / SwiftShader Device (Subzero). This is software rendering in the automated runner, NOT the visitor's target GPU. Frame times cannot substantiate an FPS improvement on the user's machine. Native traversal stops within an arrival tolerance, so before/after camera coordinates are recorded rather than claimed identical.

Clean baseline: camera (-0.086745,1.698723,2.541132), 160 draw calls, 38,044 submitted triangles, 337 resident geometries, 5 textures, 13 shader programs. Median frame time 190.9 ms, p95 218.8 ms. The first baseline attempt reported ERR_NO_BUFFER_SPACE and was excluded; the repeated baseline passed without console errors.

Post-change measurement passed without console/page errors: camera (-0.132029,1.698723,2.309417), 124 draw calls, 38,186 submitted triangles, 291 resident geometries, 6 textures, 16 shader programs. Median 160.3 ms, p95 176.4 ms. The native arrival differed by approximately 0.236 m, so the comparison is not an identical-camera GPU benchmark. In this view: 36 fewer calls (22.5%), 46 fewer geometries, and 142 more submitted triangles (0.37%). The additional texture is the designation plate; instancing/material variants account for more compiled programs. Frame-time changes are descriptive only, not a causal or target-hardware FPS claim. Instance batching reduces per-object culling granularity: a visible aggregate batch may submit offscreen member boxes. This small triangle tradeoff must be reported alongside draw-call/resource changes, not hidden behind a claimed FPS gain.

## Files and verification

- `BridgeRoof.tsx`, `HullPanel.tsx`: replace per-beam rendering; remove the unused original beam component.
- New `roofFrameLayout.ts`, `RoofFrames.tsx`, `roofFrames.test.ts`: shared transforms and static batches. Unit checks preserve every endpoint, section, handedness and practical-strip transform.
- New `BridgeDesignation.tsx`; mounted by `ShipHull.tsx`.
- `GameDiagnostics.tsx`: add renderer resource counts to the existing development-only snapshot.
- `e2e/roof-performance.spec.ts`, `playwright.monitor.config.ts`: repeatable native benchmark without recordings. `e2e/helpers/game.ts` uses bounded short native W holds and mouse corrections to avoid overshooting waypoints at software-renderer frame rates; no camera/body setters or gameplay bypass. `e2e/architecture-v2.spec.ts` keeps the rear route nearer the aisle center.
- Documentation.

Typecheck, lint, 16 focused unit tests and production build passed. The production JS was checked for the development diagnostic marker and contains none. Three distinct E2E scenarios passed: the clean post-change measurement, full bow circulation/console containment/jump/landing/return (2.6 minutes), and physical Archive reading/CV download/native Pointer Lock restoration (2.5 minutes). The clean baseline measurement also passed separately. The first functional runs overshot native walking waypoints; final reruns passed after the bounded-hold helper change, without modifying gameplay controls or colliders. Repository-wide format checking still flags the same four untouched source documents; changed-file checks are separate. The existing large-chunk warning remains (Game JS approximately 3.339 MB before gzip). Full historical suites were not run. A Windows case-insensitive module-resolution conflict in the first implementation was corrected by giving the layout module and React component distinct base names; the failed/interrupted run is not counted as validation.

Validation commands: `npm run typecheck`, `npm run lint`, `npm run test -- --maxWorkers=1` with roofFrames/bridgeLayout/commandLayout/station test files, `npm run build`, targeted Prettier and `git diff --check`. Browser runs use `npx playwright test --config playwright.monitor.config.ts` with roof-performance, architecture-v2 (elongated bow) and physical-monitor (physical Archive) scenarios. The comparison is retained above; no claim is made that unrelated historical E2E routes are all current.

## Manual review

Review the sign's legibility/material and roof appearance from several angles. Final assets, decals beyond this one modest sign, glass retuning, shadows and postprocessing are intentionally deferred until visual review and target-GPU profiling. No screenshots or videos were generated. Stop here for review.
