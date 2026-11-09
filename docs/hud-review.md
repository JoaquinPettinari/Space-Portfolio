# HUD review — 2026-11-09

Reviewed commit 0ee92c2 (Changing HUD) and the existing local GameHud change before editing. The commit changed HUD styling/fonts and shortened the contact notice; mission definitions, reducer and completion callbacks were not removed. Preserved the local condition hiding the brand during terminal/tablet use.

## Changes

- Pause uses the cyan/graphite treatment with a dimmed, slightly blurred background. Only Resume mission, Ambient sound and Subtitles controls remain. Audio stays mounted when hidden. Focus is trapped in the visible pause dialog.
- Escape can resume from pause; T opens the focused tablet from pause. Browser Pointer Lock failures continue to use the existing error state.
- MissionChecklist displays the existing missions and protocol.completed state with ticks and struck-through titles. No second progress store, extra objectives or progression rules.
- Production subtitle is rendered once in the viewport HUD; GameWorld receives no subtitle content for its transformed physical monitors. Terminal captions are compact and non-interactive to avoid competing with modal keyboard focus. The subtitle toggle hides captions without replaying the dialogue queue.
- Restored the contact notice stating that transmission sends a real message. Languages and existing validation/API unchanged.
- Existing CSS formatting normalized. No dependencies or 3D geometry changed.

## Validation

Typecheck, lint, formatting and production build passed. 141 unit tests across33 files passed. Three dialogue/HUD E2E scenarios passed across targeted runs: timed dialogue/tablet reopening; power/bulkhead dialogue; pause/ESC/T, mission completion, Central Archive caption placement and pointer restoration. No screenshots or videos generated. Initial new E2E selector matched both tablet and HUD lists; corrected to scope the HUD assertions to Recovery objectives.

Manual visual review remains required for the final look and additional viewport sizes. The production build still reports the existing large 3D chunk warning. Automated browser coverage uses Chromium, not Opera.

## Follow-up: Escape and native Pointer Lock

Browser-native Escape unlock can consume keydown. An unexpected unlock while walking now opens pause immediately; programmatic unlock for terminals, tablet, suspension or blur does not. A single Escape action is consumed through keyup, preventing the same gesture from both exiting an interaction and pausing. Capture after closing a terminal with Escape occurs on key release, not keydown. The cursor recovery notification/button has been removed as requested.

Unit coverage includes native unlock without keydown, duplicate keydown/keyup handling, delayed Escape capture, all terminal modes and tablet exits. Typecheck, lint, build and 144 unit tests passed. Browser coverage explicitly checks first-press pause and requires real Pointer Lock restoration for button, E and Escape exits. Chromium is tested; Opera still requires manual verification.
