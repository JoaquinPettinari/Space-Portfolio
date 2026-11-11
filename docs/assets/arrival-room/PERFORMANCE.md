# Arrival performance and interaction validation

## Method

Measured locally with Playwright at 1280 × 720, native keyboard/mouse and real
Pointer Lock. No screenshots or videos. `e2e/arrival-performance.spec.ts` samples
24 animation-frame intervals after five warm-up frames, then separately times
12 read-only diagnostic snapshots. These short samples are diagnostic, not a
long-duration FPS guarantee or a measurement of initial download time.

| Configuration                                                                       | Median frame | p95 frame | Median snapshot |
| ----------------------------------------------------------------------------------- | -----------: | --------: | --------------: |
| Original GLB, two lights, Headless Shell / SwiftShader                              |     933.3 ms |  966.7 ms |         10.4 ms |
| Corrected normals/culling, two lights, same software renderer                       |     616.7 ms |  633.3 ms |          9.9 ms |
| Corrected GLB, lights temporarily disabled, same software renderer                  |     516.7 ms |  549.9 ms |          9.8 ms |
| Corrected GLB, original two lights, full Chromium modern headless / Intel UHD D3D11 |      13.9 ms |   20.8 ms |          8.7 ms |

The last comparison changes the rendering backend, not only the application.
Do not attribute that entire improvement to the asset correction. The two
original warm point lights are retained; disabling lights was only an experiment.
GPU availability depends on the host; CI may still use software rendering.

Arrival sample: 316 draw calls, 133,770 triangles, 246 geometries, 14 textures,
19 shader programs. This counts the rendered scene, not just the arrival asset.
The GLB itself is 6,310,444 bytes, seven material batches, 67,632 triangles and
eight embedded 512 × 512 textures. Download size is not GPU memory consumption.

## Changes

- Correct inward face winding on temporary evaluated export meshes. Enable
  backface culling on opaque materials; glazing stays double-sided. Source
  Blender objects/materials are not modified. Unit coverage checks positive
  signed volume per batch and opaque culling in the actual exported GLB.
- Use full Chromium (`channel: 'chromium'`) instead of Headless Shell in browser
  test configs. The arrival-validation config now aliases the normal monitor
  configuration: no lower resolution or special slow-test allowance.
- Declare the existing SVG favicon to eliminate the real `/favicon.ico` 404.
  Console errors remain test failures; error messages now include the URL.
- Preserve room layout, lighting, colliders, door state machine and Crew Access.
- Production CSP permits `blob:` only in image/connection directives for embedded
  GLB textures. Previously GLTFLoader's texture fetches were blocked. Scripts,
  workers and external network origins remain restricted. The production test
  exercises normal loading without CSP violations and separately verifies inline
  script rejection. Its removed HUD-button selector and tablet input sequence
  were updated to the current UI; camera return retains its 650 ms animation.

## Validation commands

- `npx playwright test --config playwright.monitor.config.ts e2e/architecture-v2.spec.ts e2e/bulkhead.spec.ts --grep "open docking arrival|credential-controlled|reduced motion" --repeat-each=2`:
  **6 passed**, 2.4 minutes. Covers actual approach/E, credentials, automatic
  unlock/open, intermediate leaf positions, closed collision, open crossing,
  return, reduced motion, reload reset and console exceptions/errors.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run test -- src/game/world/arrivalRoomAsset.test.ts src/game/world/arrivalRoomLayout.test.ts src/game/world/entryLayout.test.ts src/game/world/bulkhead.test.ts src/game/world/bulkheadAsset.test.ts src/game/interaction/station.test.ts src/game/interaction/hints.test.ts src/game/missions.test.ts --maxWorkers=1`:
  **29 passed across 8 files**.
- `npm run build`: passed; existing large game chunk warning remains.
- `npx playwright test --config playwright.production.config.ts`: **1 passed**,
  including real Pointer Lock, Archive, accessible fallback, embedded texture
  loading, no debug API in production and deliberate inline-script CSP rejection.
- Changed-file Prettier check and `git diff --check`: passed. Global
  `npm run format:check` still reports four untouched documents:
  `docs/assets/modular-architecture/README.source.md`,
  `docs/assets/sliding-bulkhead/INTEGRATION.md`,
  `docs/assets/switch-lights/INTEGRATION_POWER_SWITCH.md`,
  `gdd/CRUZ_DEL_SUR_TERMINALS_SPEC_v1_2.md`.

## Remaining observations

Read-only diagnostic snapshots cost about 9 ms locally and should not be called
inside a frame-time sampling loop. They are development-only. Full-scene raycasts
in diagnostics and interaction targeting are candidates for a separately measured
follow-up; do not bypass occlusion checks to optimize them. No BVH or dependency
was introduced here. Resource counters are observations, not a long-run leak test.

Manual review remains appropriate for lighting/material appearance after normal
correction and sustained performance in Opera. Existing Three.js Clock and Rapier
initialization deprecation warnings are distinct from runtime exceptions.
