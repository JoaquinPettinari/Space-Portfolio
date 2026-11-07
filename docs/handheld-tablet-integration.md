# Handheld mission tablet — integration contract

The component is a provisional camera-relative prop with two simple astronaut gloves. It is not a final model. No screenshots/videos or final assets are generated.

## Input strategy

Use three explicit modes from `src/game/tablet.ts`:

- `lowered`: standard FPS.
- `held`: T raises the tablet; WASD and real Pointer Lock continue. The screen is read-only. Mouse still controls camera, not a fake cursor.
- `focused`: R is the explicit cursor handoff. Exit Pointer Lock, pause gameplay movement/physics and show the existing accessible MissionTablet UI on the held screen. Keyboard Tab navigates the native DOM. R or the Walk with tablet button returns to held and requests Pointer Lock synchronously in that gesture. T or Close tablet lowers it. Escape deliberately pauses/releases control.

On browsers denying a new capture, preserve the existing explicit resume hint; never claim the cursor was captured. While unlocked, provide a normal HUD button to focus the held tablet (in addition to R). This strategy avoids interpreting mouse movement as both camera rotation and cursor movement.

## Parent wiring (Game owns input)

1. Replace the boolean tablet-open state with `TabletMode`. `tabletTransition` is pure and testable; no game state lives in the view model.
2. Mark the tablet objective when T raises it, not when R focuses it. `held` does not pause physics or disable mouse look. `focused` does both and exits Pointer Lock.
3. Mount `HandheldTablet` once inside Canvas, outside Physics. Pass state/currentObjective and callbacks. Keep mounted while lowered so the lower animation can complete. Suppress/dismiss it before opening any station interaction or Quick Archive.
4. Parent keyboard owns T/R/Escape. Ignore T/R in editable fields and repeated keydown. Disable world E interactions while tablet is held/focused so it cannot accidentally activate something behind the prop; T restores normal world interaction.
5. `onContinue`, `onSkip`, `onReplay` dispatch existing protocol events, then resume held mode if desired. `onClose` lowers and recaptures in the gesture; `onResume` returns to held and recaptures in the gesture. `Escape` lowers and pauses, never recaptures automatically.
6. Focused mode can use demand rendering. The component invalidates during raise/lower/centering animation and after DOM mount. Held mode needs normal walking frames. When entirely suspended by accessible portfolio, hide its parent as for other Canvas HTML.
7. On loss of focus/Pointer Lock keep existing key clearing. A visible held tablet is not permission to move with an unlocked mouse. `playing`/active remains authoritative.

## Geometry and content

- Camera-relative root follows Player's camera at frame priority −0.25 (Player updates at −0.5).
- Frame 1.24×0.82×0.07; screen 1.12×0.70 from 800×500 CSS px and Drei factor0.56 (`px * factor / 400`). Z=−1.15, held Y=−0.22, focused Y=0. Portrait viewports scale down to remain inside view.
- Both gloves and wrists are lightweight box geometry; no colliders, no raycast targets and no new lights. The viewmodel uses depthTest=false to avoid wall clipping when close to geometry.
- Raising/lowering uses refs and exponential interpolation; no per-frame state updates or new vectors. Reduced motion snaps the pose.
- `DeckMap` is shared by both modes, derived from the current room's coordinates at30 SVG units/metre, including existing airlock. It intentionally does not show the future bridge. Update the crew marker when Phase3 moves identification.
- Existing full MissionTablet remains the interactive UI; handheld styling removes the fullscreen backdrop and constrains scrolling to the physical display. Skip Tutorial is retained. No professional content is duplicated.

## Verification still needed after integration

Run actual T/WASD/R/Tab/Skip/T/Escape/Pointer Lock E2E, verify body keeps moving only in held mode and stops in focused mode, check no held-key drift on return. Check camera bounds and physical screen interaction on desktop and narrow viewport. No automated screenshots/videos. Parent must validate final wiring; isolated component unit tests do not prove live Pointer Lock.
