# ADR 0001 — Popup-portal pattern

**Status:** Accepted (P14c-onwards, post-2026-04 series).
**Context:** Stefan-2026-05-09 P41 + P46 + P47 lessons.

## Context

The card needs to render multiple kinds of popup overlays (color-wheel, saved-colors, topology, parallel-sliders, effects-list). HA's Lovelace dashboards wrap cards in containers that often have CSS `transform`, which breaks descendant `position: fixed` (the fixed element positions relative to the transformed ancestor, not the viewport).

We tried:

1. **Render popups inside the host's shadow DOM.** Position-fixed broke when the parent grid card had `transform`. Popup mounted off-screen or inside the wrong scroll-area.
2. **Render popups with `position: absolute` and inline `top`/`left`.** Worked until the page scrolled — popup stayed at original document-y, drifted from the anchor element.
3. **Use Lit's built-in slot mechanism.** No isolation from ancestor CSS (transform-ancestor still propagated).

## Decision

Mount popups in a single body-portal element appended to `document.body`, escaping every ancestor's CSS context.

```ts
override connectedCallback(): void {
  super.connectedCallback();
  if (!this._popupPortal) {
    this._popupPortal = document.createElement('div');
    this._popupPortal.className = 'everyday-popup-portal';
    document.body.appendChild(this._popupPortal);
  }
}
```

Render templates flow through Lit's `render(template, container)` directly into the portal:

```ts
render(
  html`${this._renderWheel()}${this._renderSaved()}${this._renderEffects()}`,
  this._popupPortal,
);
```

Per-card-instance portal (not a singleton) so multiple cards on the same page don't fight for the popup slot.

## Consequences

**Good:**
- `position: fixed` works correctly. Popups land where they're supposed to.
- `position: absolute` with `inline top/left = anchor.bottom + window.scrollY` makes the popup scroll with the page (P46 R27 lesson).
- Single styles block injected once into `document.head` via id-based dedup (`#everyday-popup-portal-styles`) — every card-instance + every popup-type uses the same `.inplace-popup`, `.topology-popup`, `.parallel-popup` rules.

**Bad:**
- Lifecycle: portal must be created in `connectedCallback` and torn down in `disconnectedCallback`. Forgetting either leaks DOM.
- Event listeners on portal-rendered elements aren't bound by Lit's directive system in the same way as shadow-root templates — outside-click handling needs explicit setup.
- Light DOM = global CSS scope. The injected styles use the `.everyday-popup-portal` class as a scope-guard, but a malicious or sloppy theme can override.
- Z-index management across multiple popup-types in the same portal needs explicit ordering (wheel/saved at z-200, topology/parallel at z-99 — see POPUP_PORTAL_STYLES).

**Migration cost:**
- Initial: ~150 LOC of portal lifecycle + style injection in 2 cards (`everyday-light-card.ts`, `group-layout-expanded.ts`).
- Recurring: every new popup-type adds ~30 LOC for its render-method + CSS rules in `popup-portal-styles.ts`.

## Alternatives considered

- **Use a third-party portal library** (e.g. `@lit-labs/scoped-registry-mixin`). Rejected: adds a dependency for ~50 LOC of behavior we already understand.
- **Render in shadow DOM + use `:where()` to escape transform-ancestor.** Doesn't work — `position: fixed` semantics are hard-coded into the browser's transform-handling.
- **Use the Popover API** (`popover` attribute). Browser support limited at the time of decision (Safari shipped late 2024). Re-evaluate post-2026 when baseline support is universal.

## Related

- `src/helpers/popup-portal-styles.ts` — the shared CSS block.
- `src/helpers/picker-controller.ts` — the controller that orchestrates popup state.
- CHANGELOG entries P41 R10/R11, P46 R27/R28, P47 R30/R31a.
