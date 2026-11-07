# Central Archive — physical monitor prototype

Date: 2026-11-07. Scope: Archive only; bridge rebuild and other terminal migrations await visual approval.

## Architecture audit

- `Game.tsx` owns walking/terminal modes, transition state, mission callbacks and synchronous Pointer Lock recapture. `Player.tsx` already interpolates the observation camera over 0.65 seconds, preserving the player's physics body and return orientation. Reduced motion completes the transition immediately.
- Previously `Computer.tsx` rendered outside Canvas as an opaque full-screen dialog with a CSS bezel. The actual mesh monitor in `Workstation.tsx` was only a target for E. Its focus pose existed but the overlay hid it.
- `PortfolioContent.tsx` already owns all professional navigation and reuses `src/data/portfolio.ts`, project images and `ContactForm`. No professional data needs copying.
- Quick Portfolio Access previously suspended the game and displayed the shared content on a standalone DOM page. This remains the accessible alternative; the in-game quick route now uses the Archive focus mode.
- Communications, Personal Workstation and crew hologram retain their existing behavior in this prototype. The latest requested Crew Access/Tactical split supersedes the old GDD layout, but is a later implementation phase.

## Prototype decisions

`ArchiveScreen.tsx` mounts Drei `Html transform` only after the camera settles in computer mode. It places the existing React `Computer` content at `(0,1.55,-3.535)`, just in front of the existing monitor surface. It unmounts on exit before the return transition, so no active HTML floats through furniture while walking.

No new dependencies, textures, lights, shadow maps, postprocessing or 3D assets. The physical bezel, desk, chair and colliders remain unchanged. No relocation to the proposed left console yet.

The screen's CSS canvas is 900×498 px. The installed Drei implementation scales CSS pixels by `distanceFactor/400` in transform mode. With `distanceFactor=2/3`:

```text
900 * (2/3) / 400 = 1.5 world units wide
498 * (2/3) / 400 = 0.83 world units tall
```

This matches the existing screen (1.5×0.83), leaving its 1.65×0.98 physical casing visible. The old CSS bezel has no padding, shadow or border in this mode; the background is restricted to the physical screen. Amber focus/accent colors are a small interface experiment, not a completed art pass.

The DOM mount explicitly invalidates one R3F frame via `onDisplayReady`. Without that, demand rendering can stop before Drei's separate React DOM root receives its first CSS camera transform, leaving an untransformed screen at the viewport origin. This was reproduced by browser tests and corrected without switching the settled monitor to continuous rendering.

The fixed CSS canvas makes screen alignment independent of DOM content height. Header, navigation and footer stay fixed; the content pane scrolls. Navigation focuses the new heading without scrolling the CSS-transform ancestors, and resets only the content pane's scroll position.

The desktop focus remains `(0,1.55,-2.55)`. On narrow viewports the observation camera backs away to fit the 1.65 m bezel within 85% of viewport width:

```text
distance = 1.65 / (2 * tan(65°/2) * aspect * 0.85)
cameraZ = max(-2.55, -3.535 + distance)
```

This preserves the frame; it cannot make a wide physical display comfortably readable on every phone. An explicit Accessible HTML portfolio button is always available in the monitor and pause UI. No WebGL is required for the standalone fallback.

## Input and access paths

- E on the existing monitor uses the existing camera/mode transition, releases Pointer Lock and opens the DOM dialog on the physical screen.
- Tab cycles inside the Archive; headings receive focus on navigation. Exit computer is initially focused. Mouse clicking, text selection, form fields and scrolling remain native HTML.
- Exit computer and E retain the synchronous capture request in the initiating gesture. Browser denial still uses the existing recovery hint; do not promise capture after arbitrary non-user events.
- Escape deliberately releases controls and returns to pause; it must not immediately recapture the mouse.
- Pause → Quick Portfolio Access invokes the same computer mode via a small imperative ref from App to Game. It does not complete a mission or teleport the physics body. The camera transition is a convenience focus, not a physically collision-tested flight path from arbitrary remote positions (including the closed airlock).
- Pause/monitor → Accessible HTML portfolio suspends the preserved scene and reuses PortfolioContent outside WebGL. Returning restores DOM focus inside any still-open terminal.
- If WebGL is unavailable or the station error boundary fails, Quick Portfolio Access opens the standalone HTML page directly.

## Scope limits and next approval

Manual visual review belongs to the user. No screenshots or videos are generated for this prototype. Automated checks cover interaction and layout bounds, not aesthetic approval or performance on the user's Opera/GPU.

Review monitor scale, text legibility, amount of visible frame, focus transition and whether the interface feels embedded. Only after approval adapt Communications and Personal; then approve the floor plan in `bridge-layout-proposal.md` before rebuilding the hull. Crew Access and Tactical remain separate follow-up features. Existing missions/CV/contact remain intact meanwhile.

## Validation

The dedicated `playwright.monitor.config.ts` disables screenshot, video and trace recording, including on failure. It does not run older suites that explicitly capture media.

- `npx playwright test --config playwright.monitor.config.ts`: initial three scenarios passed together (33.2 s); the fourth contact scenario was added and passed separately (8.2 s total). Four distinct passing scenarios, not a single four-test run.
- Covered real E approach, Pointer Lock on button/E exit, return pose, keyboard focus, scrolling, actual CV download, quick access without mission gates, viewport sizes 1280/960/390 and HTML fallback without WebGL.
- The final helper verifies DOM width/height against the physical screen projection from FOV and camera distance (2 px tolerance), exercised by the contact run. Contact uses mocked 503 then confirmed acceptance, preserves the draft and tests status focus. No real message is sent.
- `npx playwright test --config playwright.production.config.ts`: 1/1 passed, including production build and CSP enforcement, physical quick access and standalone HTML route (20.1 s total). Known large-chunk warning remains; no unexpected browser console errors.
- Initial failing browser runs revealed the demand-rendering mount bug described above. Tests passed after fixing the product; no Pointer Lock mocks or observation setters were used.
- No screenshots, videos or traces were generated. Manual art/legibility review in Opera and hardware performance measurements remain pending.
- `npm run test -- --maxWorkers=1`: 110/110 tests, 22 files passed (60.46 s). Typecheck, lint and full format check passed; `git diff --check` passed. Production build ran successfully as part of the production E2E command above.

The approved concept image arrived after implementation of this isolated prototype. The bridge proposal now incorporates the visible right-side Personal Workstation and centered table. No additional scene changes were made in response to the image; the monitor remains in its current location until the staged review proceeds.
