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

## Projects list — visual iteration

The physical Archive project index reuses the existing project data and navigation. Two cards show real report images, academic category, title, summary, four technologies and Open record. Styling is scoped to `.central-archive .archive-project-list` and uses the terminal color variables. Project Detail remains the existing implementation for a later iteration. The browser regression checks both records and that the index fits without horizontal or vertical overflow.

## Project Detail — visual iteration

ProjectDetail is a shared DOM component with a numbered image selector, existing factual project copy and source links, Back to projects, and bounded Previous/Next navigation. The focused physical display uses two columns: media/stack and a keyboard-focusable scrolling reading pane. Navigation and Exit remain outside that scroll. Changing project resets its image selection; headings receive focus through the existing portfolio navigation. The HTML fallback remains responsive without WebGL. No scene, camera, input or professional-data changes. Manual visual review remains pending.

## Service Record — visual iteration

The physical Archive uses ServiceRecord with four selectable employment records and one detailed sheet. All employer names, roles, dates, locations and responsibilities come unchanged from portfolio.ts. The CV remains directly downloadable. Buttons use native keyboard activation and announce the updated sheet; browsing employers does not emit extra mission events. The non-WebGL version retains its complete employment list. Browser checks cover each employer's fit and CV download; the native-wheel regression now exercises the long Project Detail reading pane instead of the paginated employment screen. Manual visual approval remains pending.

## Education — visual iteration

EducationRecords shows all three existing academic/certification records with unchanged institution names and dates, plus the existing language proficiency text. Physical navigation and heading now both say Education. No invented graduation status, certification date or new mission event. The non-WebGL version remains available. Tests cover factual content, keyboard navigation, monitor overflow and return to FPS; visual approval remains manual.

## Earth Communications — visual iteration

The existing ContactForm now uses a composition header, grouped fields and a single action row (Skip left, Send Transmission right). Physical-only styles fit the forward monitor, with the existing fixed exit/footer. The real-send notice, four accepted languages and fallback email link remain visible. No artificial API-online indicator is displayed. Terminal colors now live in index.css as shared --terminal-* variables. Backend validation, provider acceptance, abuse protection and request lifecycle remain unchanged; automated delivery is mocked. Browser checks cover fit in idle, skipped, failed and accepted states. Manual visual approval remains pending.

## Personal Workstation — visual iteration

The existing desktop now shows a real crew portrait and compact identity card beside four application tiles. Existing CV, Project Gallery, Station Settings and whitelisted Command Terminal are preserved. Opening an app changes the launcher to a compact row and hides the identity card without removing the launcher controls, preserving Escape/focus restoration. The physical monitor remains 770 × 560; no geometry or camera changes. Gallery assets remain explicitly labeled academic project screenshots, not invented personal memories. Uses shared terminal tokens; manual visual review remains pending.

## Crew Access — visual iteration

CrewIdentity now presents a card-reader illustration beside the existing approved portrait, real name/role/location and verified Master's Degree. The detailed profile summary is removed from this compact identity screen and remains in Central Archive. Scanning and access-granted display remain driven by the existing identity state; no new authentication, timers, mission events or animations were introduced. The original one-E card interaction is preserved. No invented ID, clearance or division copied from the mockup. Physical screen and cancellation regressions are retained; manual visual review remains pending.

## Tactical Table — first functional iteration

Audit found only the procedural table, with no active tactical mode; the unused legacy HologramPanel is not mounted. Added a tactical interaction target, fitted focus pose and one physical HTML interface with Station Overview, Docking Bay, Systems and Mission Log. It reuses the existing camera transition, Pointer Lock restoration and TerminalPanel focus handling. Table colliders and bridge geometry are unchanged.

TacticalStation renders four untextured wireframe meshes showing a provisional bridge/airlock layout, with slow delta-based rotation, reduced-motion handling and bounded zoom. No lights, shadows, assets, dependencies or second canvas were added. The active view invalidates demand rendering while auto-rotation runs; other terminal modes and suspended/hidden states stop its rotation. Manual rotate buttons and a native range input support mouse and keyboard. No docking state/model exists for PAMPA-07: the interface explicitly reports unavailable docking telemetry instead of inventing an acoplamiento or delivery status. Mission Log reflects completed session objectives, without fictional timestamps. The table emits no mission activity.

Manual visual review is required for hologram alignment and legibility; the schematic is deliberately not the final exterior model. The viewport/camera interaction uses a 960 × 540 panel mapped to 2.4 × 1.35 world units at [0, 1.85, 1.05]. The wireframe is centered above the existing table at [0, 1.85, 0.5].

Validation for Tactical Table: 153 unit tests passed; typecheck, lint and production build passed. Targeted browser scenarios for the Archive regression and the tactical journey passed in separate runs. The initial narrow floor-waypoint approach was unreliable on this runner; the tactical test now uses actual WASD until the interaction hint appears. Focused scene sample: 123 draw calls, 37,704 triangles, 197.6 ms last frame. This is one automated-environment sample, not proof of smooth hardware rendering; real-device performance remains to be reviewed. Existing large-bundle and GDD-format warnings remain. No screenshots/videos generated.

### Tactical side focus

The tactical interaction now frames the table from its left long side. The HTML plane is at [-0.55, 1.85, 0.5], rotated -π/2 around Y; the shared focus calculation places the camera outside the table's X collider while keeping its Z centered at 0.5. The model, table geometry and return-to-player behavior are unchanged. This supersedes the earlier front-facing panel coordinates.
