# Arrival revision — 2026-11-10

## Implemented sequence

PAMPA-07 collar → permanently open docking hatch → receiving room → Crew Access / secured bulkhead → panoramic passage → existing compact bridge.

- Spawn [0,1,17.1]; eye settles near Y1.7. Hatch Z16.2, clear opening2.4 ×2.5m.
- Receiving floor X±2.8, Z11.2…16.3, topY0. Usable room behind the door pockets: 5.4 ×4.03m, Z12.07…16.1. Central ceilingY3.0, chamfered shoulders and matching colliders. Framed port window, opposite shallow storage faces; no opaque wall behind glazing.
- Crew screen [2,1.68,12.515], existing single-E identification/card gesture. DoorZ11.65; existing GLB/two sliding leaves, pockets and kinematic collider synchronization retained. Amber locked indicator; green on authorization. No second E required.
- PassageZ5.1…11.2, length6.1m, 2.8m clear width, height3m. At3m/s, ideal traversal2.03s. Adds angled ribs, segmented floor, gaskets and exterior hull members, with repeated detail in five static instanced batches.
- Compact bridge geometry, console framing and professional content unchanged.

## State and access

The existing lighting objective starts completed and reads Arrival systems online; no power switch is mounted. Its reusable GLB/component remains available for future use. Crew verification alone authorizes the door. Reload resets credentials and the door while retaining automatic arrival power. Mission skipping and Quick Portfolio Access remain independent of the physical entry. Map and dialogue match the new sequence; no CSS redesign.

## Validation and limits

Typecheck, lint, changed-file formatting and production build passed. Build retains the pre-existing large Game chunk warning. 45 relevant unit tests passed across protocol, hints, terminal camera, tablet, checklist, door mechanics/asset, arrival geometry and dialogue. Full suite was interrupted after the stale switch-map reference was discovered; no claim of a full-suite pass. That reference was corrected before the successful targeted run.

Real browser checks passed for arrival/credentials/automatic opening/bridge crossing/return/reload, reduced-motion crossing and ungated Quick Portfolio Access with native Pointer Lock. The detailed native door-motion/collision test also passed on retry (3.0 min), including blocked movement before authorization, intermediate leaf offsets and two-way crossing. Its first run timed out while approach + scan + opening shared one 15-second wait; the retry waits explicitly for ACCESS GRANTED before polling opening, and stops collecting motion samples once open. All collision and animation assertions remain. Four distinct E2E scenarios passed in total. No screenshots/videos generated. Historical suites describing a mandatory switch (airlock.spec.ts and station.spec.ts) were not run or treated as current acceptance criteria.

Observational renderer samples (not a before/after benchmark): arrival atZ14.95,31 calls,792 triangles,255 geometries,6 textures,15 programs; bridge atZ2.15,127 calls,38700 triangles,262 geometries,6 textures,15 programs. Single frame observations ~190/194ms in the software-rendered test environment do not establish visitor GPU performance. No new real lights, shadows or postprocessing.

Manual review remains necessary for proportions, glass/material appearance, rear hatch presentation and the bridge reveal.
