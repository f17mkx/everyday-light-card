# ADR 0002 — Mindmap as SVG component

**Status:** Accepted (P4-onwards).
**Context:** P4 mindmap-path component design. Refined through P14-P15 alignment iterations.

## Context

The card needs to render a "mindmap" connecting a group-master icon to N member icons. Curves should look hand-drawn (Pouzor/homelable reference), responsive to slider-height changes, and cover N=1..5 members natively + N≥6 with a comb-fallback.

Design constraints:

- Curves must follow CSS layout — when sliders grow taller, the SVG endpoints shift accordingly. No redraw-on-resize; the SVG should be CSS-driven where possible.
- State-reactive: the group-dot stroke color reflects the master entity's state (off = gray, on = active-orange or current rgb).
- Theme-aware: arms must be visible on both dark and light HA themes.
- No external SVG library. Lit + native `<svg>` only.

## Decision

A standalone Lit component `<everyday-mindmap-path>` that renders an SVG with:

1. Configurable member-count via `count` attribute. Switches between hand-tuned arm geometries (N=1..5) or a comb-fallback (N≥6).
2. Configurable slider-height via attributes/properties so the SVG endpoints align with the actual layout.
3. CSS variables for theming (`--disabled-color`, `--state-light-active-color`).
4. ResizeObserver wired to the host's content-rect so the SVG re-paints on layout changes.

```html
<everyday-mindmap-path
  count="3"
  .members=${[{state: 'on', rgb: [255, 90, 90]}, ...]}
  .groupActive=${true}
  dotsEnabled
  groupDotEnabled
></everyday-mindmap-path>
```

Internal: `getCurves()` returns an array of SVG-path d-strings. Each curve = a quadratic-bezier from the group-dot center to a member-dot center, with control-point offsets tuned per N. Symmetric for even N, slightly asymmetric for odd N to avoid visual clutter.

## Consequences

**Good:**
- Decoupled from the host card. Changes to mindmap geometry don't touch `group-layout-expanded.ts`. Single component to test in isolation.
- Composable. The standalone test page (`assets/test/mindmap-test.html`) renders the component for every count + member-state combination without a real HA.
- Native SVG features (gradients, filters, `mix-blend-mode`) available without library overhead.

**Bad:**
- Calibration is hand-tuned. Each new count or slider-height-target requires a manual pass through `getCurves()` to get the curves looking right. Math-based calibration was attempted (P15.6 r16) but residual visual drift always required Stefan to fine-tune.
- ResizeObserver fires on every layout change, including unrelated scroll-induced reflows. Throttling not currently applied; could be a perf concern on dashboards with many group cards (rare in practice).
- The "groupDot circle as halo around the icon-tile" trick (R133) abuses the SVG `overflow: visible` attribute + a negative `margin-bottom` on the wrapping div. Visually correct, but a future refactor should consider rendering the icon-tile INSIDE the SVG via `<foreignObject>` or moving to a Canvas approach.

## Alternatives considered

- **`<canvas>` rendering.** Rejected: harder to make state-reactive (every state-change = full repaint), no native CSS-var theming.
- **Pure CSS (linear-gradient + transform).** Rejected: can't draw curved paths in CSS without SVG.
- **D3.js or similar.** Rejected: bundle-size hit for what's effectively 5 hand-tuned curves.
- **Render mindmap inside the host card's static styles.** Rejected: violates separation; the host card already has 2500+ LOC, mindmap deserves its own component.

## Related

- `src/components/mindmap-path.ts` — the component.
- `src/components/group-layout-expanded.ts` — the consumer; computes `effectiveSliderHeight` and passes it to the mindmap.
- CHANGELOG entries P4, P14, P15.6 r7, r16, r19, r20-r27 (alignment saga).
- `docs/wiki/04-group-layouts.md` — user-facing description.
