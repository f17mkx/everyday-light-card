# ADR 0003 — Gesture detector design

**Status:** Accepted (P6-onwards). Refactored to PickerController in P14c.
**Context:** Need a unified gesture vocabulary across the card.

## Context

The card has multiple interactive surfaces (member-icons, group-icons, sliders, picker-overlays). All should respond to:

- Tap (down + up under threshold)
- Long-press (down + hold ≥ threshold)
- Double-tap (two taps within window)
- Press-drag-select (long-press + drag onto picker option)

The original card used per-surface event handlers, leading to duplicated tap-vs-long-press disambiguation logic in 5+ places. Bugs surfaced when:

- Tap and long-press fired both (race condition on the threshold).
- Re-renders during gesture broke the in-flight state machine.
- Phantom-clicks fired after popup-open (the same touchend that opened the popup also closed it).

## Decision

Two-layer architecture:

### Layer 1: `gesture-detector.ts`

Pure helper module. Pointer-event-based (works on touch + mouse). Single function `attachGestures(el, opts)` that:

- Tracks `pointerdown` → starts a long-press timer + records origin coords.
- Tracks `pointermove` → if drag exceeds threshold before long-press fires, cancels long-press.
- Tracks `pointerup` → if before long-press threshold, fires `tap`. If a previous tap was within double-tap window, fires `doubletap` instead.
- Returns a `dispose()` function for cleanup.

### Layer 2: `picker-controller.ts`

Lit Reactive Controller wrapping the detector with:

- Phantom-click suppression: 300 ms after any popup open, ignore taps on the host or backdrop.
- Press-drag-select: track pointer position during long-press, hit-test against picker-overlay diamond positions, fire `onModePicked(mode, origin)` on release.
- Popup state machine: `_wheelTarget`, `_savedTarget` etc. with single-active-popup invariant via `_closePickersExcept`.
- Public methods `openWheel()`, `openSaved()`, `bindIcon(el)` for host-controlled triggering.

## Consequences

**Good:**
- Single source of truth for gesture timings + phantom-click suppression. Bug fixes apply to every surface at once.
- Clean handoff to Stefan-customizable actions via `gestures.member_icon.<event>: <action>` config — the controller maps actions to its public methods.
- Reactive Controller integrates cleanly with Lit's lifecycle (auto-bound to host's update cycle, `host.requestUpdate()` triggers re-render).

**Bad:**
- Two layers means tracing a gesture from input to action takes 2 hops (detector → controller → host callback).
- The press-drag-select hit-test is geometry-coupled to the picker-overlay layout (`PICKER_ANGLES_BY_VARIANT`). New picker variants need entries in the geometry constants.
- Phantom-click suppression at 300 ms is empirical — too short = double-tap-close-bug recurs, too long = users wait noticeably before being able to dismiss. 300 ms was Stefan-validated; if it bites a future user, we re-tune.

**Migration cost:**
- P15.5 migrated the expanded-group-tile picker to PickerController. P15.6 migrated member + compact pickers. Each migration was ~50 LOC removed from `group-layout-expanded.ts` per call-site.

## Alternatives considered

- **HammerJS or similar.** Rejected: dependency for a problem we can solve in 200 LOC of pointer-event handling.
- **HA's stock long-press handler** (`@action=...`). Rejected: doesn't support press-drag-select (the killer gesture for this card), no phantom-click suppression.
- **Web Animations API for popup choreography.** Considered for future; current CSS-keyframe approach is simpler and works.
- **State machine library (XState).** Rejected: overkill for the 4-state machine (idle / pressing / picking / popped). Direct booleans + Date.now() suffice.

## Related

- `src/helpers/gesture-detector.ts` — Layer 1.
- `src/helpers/picker-controller.ts` — Layer 2.
- `src/helpers/picker-geometry.ts` — diamond positions per variant.
- CHANGELOG entries P6, P14c, P15.5, P15.6 (multiple).
- `docs/wiki/06-gestures.md` — user-facing description.
