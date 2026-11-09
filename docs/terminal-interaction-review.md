# Shared physical terminal interaction review

Source: gdd/CRUZ_DEL_SUR_TERMINALS_SPEC_v1_2.md (the supplied repository version; no v1.md file exists).

## Changes

- interaction/station.ts now describes screen pose, physical bezel, display area and current CSS pixel surface in TERMINAL_SCREENS.
- ArchiveScreen and PhysicalTerminal derive the Drei Html scale from that contract. The installed Drei transform implementation uses world units = CSS pixels × distanceFactor /400. Uniform scaling preserves aspect; current values stay unchanged.
- Player uses setStationFocus for all terminal modes. The camera sits on the monitor's outward normal and points at its center. Fit accounts for both viewport dimensions, bezel margins and actual PerspectiveCamera effective FOV (including zoom), instead of four separate axis-specific branches and a hardcoded65-degree lens.
- Caller-owned vectors are updated in place; no new frame allocations, React frame state, dependencies, observers or listeners.

## Retained architecture

GameWorld mounts only the selected monitor after its focus transition. Quick Portfolio Access uses the same ArchiveScreen instance path. Player still owns the650ms eased transition, reduced-motion shortcut, saved return rotation and player anchor. Existing Escape/Pointer Lock behavior is unchanged.

PhysicalScreen mounts one scoped document wheel adapter and removes the same listener on unmount. A StrictMode/switching regression test checks listener balance; this is a DOM lifecycle test, not a WebGL performance measurement. No extra cleanup/refactor was needed.

No UI layouts, CSS, HUD, tablet styling, portfolio content, geometry or assets were edited. The original terminal spec remains untouched.

## Integration contract for the independent UI redesign

The physical displays remain1.6 ×0.9m with960 ×540CSS pixels (Archive/Communications) and1.1 ×0.8m with770 ×560CSS pixels (Personal/Crew). Changing internal layout does not require camera changes. If the outer CSS pixel dimensions change, update the corresponding pixels entry in TERMINAL_SCREENS as part of that integration; this is an explicit contract, not automatic DOM size detection.

## Validation

Typecheck, lint, production build and148 unit tests passed. Unit cases cover portrait/desktop/ultrawide aspect ratios, FOV40/65/90, perpendicular camera placement, uniform CSS-to-world scale, zero-size resize fallback and listener cleanup. Four browser scenarios passed across targeted runs: Communications, Personal Workstation, Archive desktop/portrait framing and return, and native wheel scrolling. Initial Archive checks used an obsolete HUD button and an immediate Pointer Lock assertion; tests were aligned with the current T/R flow and asynchronous browser events. No production input behavior was changed.

No screenshots or videos generated. Manual visual review remains with the user. Opera and real-GPU frame time are not certified by Chromium software-rendered tests. Existing large-bundle build warning remains.

Formatting: changed implementation/tests/docs pass Prettier. The repository-wide format check reports only the existing untracked terminal spec; that user-owned document was not reformatted.

## Central Archive Overview — visual iteration

The user authorized React/CSS implementation based on the v1.2 reference. The physical Archive now has a fixed header and sidebar, a real crew portrait, profile summary, four existing technologies, CV download, and featured RouteWise/AccesiWeb cards opening the existing records. Colors are exposed as `--terminal-*` CSS variables in `src/portfolio/ArchiveOverview.css`. The physical display remains 960 × 540; no camera or scene geometry changes were needed in this iteration.

`PortfolioContent` retains shared project navigation and data. Its physical presentation uses Overview/Education labels and omits Contact; the non-WebGL HTML alternative retains contact access. Earth Communications is unchanged. Project detail, employment and education redesigns remain separate iterations. Manual approval of composition and readability is pending; no screenshots or videos were generated.
