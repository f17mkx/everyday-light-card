# R299 — Dynamic / relative member-cols gap scaling

**Status**: sketch (no implementation yet)
**Filed**: 2026-05-11 (PA-0026, PA-0031)
**Target r**: r63e or later (parked behind R298/R300 ship in r63d)
**Parent issue**: R292 (r63a) shipped depth-scaled gaps as ABSOLUTE values; Stefan wants RATIOS that scale with available width and recompute on expand/collapse.

---

## Problem statement

The current depth-scaled gap rule (`group-layout-expanded.styles.ts:61-66`) hardcodes:

```css
:host([depth='0']) { --member-cols-gap: 28px; }
:host([depth='1']) { --member-cols-gap: 14px; }
:host([depth='2']) { --member-cols-gap: 8px; }
:host([depth='3']) … { --member-cols-gap: 4px; }
```

That's robust but inflexible. Stefan-Quote (2026-05-11 18:53 CEST):

> wenn ich hier `http://192.168.2.231:8123/ed-slider/nested` zb spots aufklappe, dann sollen sich alle anderen gaps automatisch anpassen … aktuell sind alle abstände statisch … sie sollen aber relativ und dynamisch sein. du hast in r292 28/14/8 vorgeschlagen. Nimm diese werte doch als relationen. (und minimum abstand ist 3px oder so)

Concretely:
1. **28/14/8** become **ratios**, not absolutes: `3.5 : 1.75 : 1` (depth 0 : 1 : 2).
2. Gap-at-each-depth is **computed live** from `(card-width − total-leaf-slider-widths)`, divided across the hierarchy using the ratios.
3. Max-clamped per depth at the current absolutes (28 / 14 / 8 / 4 px). Min-clamped at 3 px floor universally.
4. **Recompute** on expand/collapse of any sub-group AND on resize.

---

## Algorithm sketch

### Inputs (per outermost group-layout instance)

- `cardWidth` = `this.renderRoot.querySelector('.layout').clientWidth`
- `leafCount` = `totalLeafCount` (already computed for `responsiveSliderWidth`)
- `leafSliderWidth` = `responsiveSliderWidth` (40-60 px, post-R300a)
- `depthMax` = deepest currently-expanded depth in the visible tree
- `ratios[depth]` = `[3.5, 1.75, 1.0, 0.5]` (extend with `prev / 2` for depth ≥ 3)

### Compute available gap-space

```ts
const totalSliderWidth = leafCount * leafSliderWidth;
const totalGapSpace = Math.max(0, cardWidth - totalSliderWidth);

// Distribute totalGapSpace across all (leaf − 1) gap-slots,
// weighted by each slot's depth (= the depth of the COMMON ANCESTOR
// of the two leaves on either side of the gap).
const gapSlots = leafCount - 1;
```

### Determine gap-slot depth for each adjacency

For each pair of adjacent leaves `(i, i+1)`, the **gap slot's effective depth** equals the depth at which they diverge in the topology tree. Implementation: walk both leaves' parent-chains; the deepest common ancestor's depth is the boundary depth (the gap is "between siblings at that ancestor level").

Example apartment view (post-Spots-expand):
```
apartment (depth 0)
├── Back (depth 1)
│   ├── kitchen (depth 2)
│   │   ├── kitchen_counter (depth 3)
│   │   └── kitchen_ceiling (depth 3)
│   ├── bathroom (depth 2)
│   ├── hall (depth 2)
│   │   ├── hall_spots (depth 3, EXPANDED)
│   │   │   ├── hall_spot_1 (depth 4)
│   │   │   ├── hall_spot_2 (depth 4)
│   │   │   └── hall_spot_3 (depth 4)
│   │   ├── hall_door (depth 3)
│   │   └── hall_boxes_2 (depth 3)
│   └── …
└── Main (depth 1)
    └── …
```

Gap between `hall_spot_1 ↔ hall_spot_2` → boundary depth 3 (deep, tight gap).
Gap between `hall_spot_3 ↔ hall_door` → boundary depth 2 (mid, wider).
Gap between `Back ↔ Main` → boundary depth 0 (outermost, widest).

### Allocate gap-space proportionally

```ts
// Group leaf-pair adjacencies by boundary depth.
const slotsByDepth = new Map<number, number>(); // depth → count
for (const adj of adjacencies) slotsByDepth.update(adj.depth, +1);

// Total weight = sum of (count * ratio) per depth.
const totalWeight = sum(slotsByDepth, (count, depth) => count * ratios[depth]);

// Each slot at depth d gets: gapPx = (totalGapSpace * ratios[d]) / totalWeight.
const gapByDepth = new Map<number, number>();
for (const [depth, count] of slotsByDepth) {
  const raw = (totalGapSpace * ratios[depth]) / totalWeight;
  const maxClamp = [28, 14, 8, 4, 2][depth] ?? 1;
  const clamped = Math.max(3, Math.min(maxClamp, raw));
  gapByDepth.set(depth, clamped);
}
```

### Apply to CSS

Each `.member-cols` element gets a `--member-cols-gap` set via inline style, derived from the depth of THAT card's host (= the depth at which the children diverge):

```ts
this.renderRoot.querySelector('.member-cols').style.setProperty(
  '--member-cols-gap',
  `${gapByDepth.get(this.depth) ?? defaultGap}px`,
);
```

Removes the static `:host([depth='N']) { --member-cols-gap: ... }` rules. Replaces them with computed inline.

---

## ResizeObserver lifecycle

```ts
private _gapObserver?: ResizeObserver;

connectedCallback() {
  super.connectedCallback();
  this._gapObserver = new ResizeObserver((entries) => {
    this._recomputeGaps();
  });
  this._gapObserver.observe(this.renderRoot.querySelector('.layout'));
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._gapObserver?.disconnect();
}

@state() private _expandStateRevision = 0;

// Trigger on any expand/collapse:
private _onChildExpandChanged() {
  this._expandStateRevision += 1;
  this._recomputeGaps();
}

updated(changed: PropertyValues) {
  super.updated(changed);
  if (changed.has('memberIds') || changed.has('_expandStateRevision')) {
    this._recomputeGaps();
  }
}
```

**Throttling**: ResizeObserver fires frequently during animations. Wrap `_recomputeGaps` in `requestAnimationFrame` so we coalesce multiple resize events into one layout-pass.

**Event propagation**: child cards need to notify their outermost ancestor when they expand/collapse. Lit event approach: child fires `composedEvent('everyday-expand-changed')`, outermost ancestor listens at `addEventListener` on connectedCallback.

---

## Test cases

| # | Topology | Expected gap at depth 0 | depth 1 | depth 2 | depth 3 |
|---|---|---|---|---|---|
| 1 | 5 leaves, depth 0 only (Hall) | 28 | — | — | — |
| 2 | 7 leaves, depth 0+1 (Bath x2, Hall x5) | 28 | 14 | — | — |
| 3 | 14 leaves, full apartment | 28 | 14 | 8 | 4 |
| 4 | 14 leaves, NARROW container (300 px) | clamp to 3 px floor or scale down all proportionally | | | |
| 5 | 14 leaves, WIDE container (1200 px) | clamp at 28 max | clamp at 14 max | clamp at 8 max | clamp at 4 max |
| 6 | Apartment after Spots-expand (14+2 leaves) | 28 | 14 | 8 | 4 (new sub-group at depth 3) |

Test setup: unit tests on a pure-function `computeGapMap(cardWidth, topology)` that returns `Map<depth, gapPx>`. Validate clamping behavior + ratio preservation in the unclamped middle range.

---

## Complexity + risk estimate

| Concern | Cost |
|---|---|
| Pure-function `computeGapMap` | low (~50 LOC, easy to unit-test) |
| ResizeObserver wiring per card-layout | low |
| Event-bus for expand/collapse cross-card | medium (Lit composed events; need event-naming convention) |
| Inline-style override of CSS-var (replaces static `:host([depth=N])`) | medium (lifecycle ordering — set BEFORE first render or use `firstUpdated`?) |
| RAF throttling | low (one-line) |
| Backwards compat with `slider.width`, embedded mode, weighted cols | medium (need to flow gap-allocation through embedded children too — they each set their own `.member-cols` gap) |

**Total**: ~150-250 LOC + tests. 2-4 hour implementation + verify-and-tune cycle.

**Risk**: layout-thrash during animations. Mitigate with RAF + tween only on settle. Also: the inline-style override of CSS-var means CSS-only theme overrides (`--member-cols-gap` in user-config) won't work — could add a `gap_strategy: 'static' | 'dynamic'` config field with `'static'` keeping current CSS behavior.

---

## Open questions before implementing

1. **Container measurement source**: outermost `.layout` element vs `<ha-card>` parent? `.layout` is more reliable (always present), `<ha-card>` width is what the user actually sees. Start with `.layout`.
2. **Event-bus name**: `everyday-expand-changed`? `everyday-topology-changed`? Pick one + document in component header.
3. **Ratios array extensibility**: hardcoded `[3.5, 1.75, 1.0, 0.5]`? Or computed `2 ** -depth * 3.5`? Latter scales nicely past depth 3.
4. **Min-clamp 3 px**: when even 3 px doesn't fit (very narrow container, many leaves), do we let columns OVERLAP, or shrink leaf-slider-widths further? Latter cascades into `responsiveSliderWidth` re-derivation. Keep simple: 3 px floor; if leaf-widths overflow, horizontal scroll on `.member-cols`.
5. **Should this also drive the inter-row `mindmap-bg-height`** and other depth-scaled spacings? PA-0031 says no — R299 is only about `--member-cols-gap`. Can revisit later.

---

## Decision log

- **2026-05-11 PA-0026**: filed as future-work (Stefan: "schreib dir das auf"). Initial spec sketched in BACKLOG entry.
- **2026-05-11 PA-0031**: Stefan reminds "nicht vergessen!!" — promoted from BACKLOG-stub to this dedicated sketch doc. No implementation in r63d (parked behind R298 revert + R300a/c which are more user-facing).
- **2026-05-11 PA-0031**: confirmed scope = `--member-cols-gap` only (not mindmap-bg or other depth-spacings). Min-clamp 3 px Stefan-Spec.

---

## Implementation plan when greenlit

1. Add unit-tested pure-function `lib/computeGapMap.ts` (no Lit dependency).
2. Add `private _recomputeGaps()` + ResizeObserver in `group-layout-expanded.ts`.
3. Replace `:host([depth='N']) { --member-cols-gap: Npx }` rules with default `--member-cols-gap: 14px` fallback (in case JS measurement fails).
4. Add event-bus for cross-card expand/collapse notification.
5. Add `gap_strategy?: 'static' | 'dynamic'` to `GroupConfig` (default `'dynamic'`; `'static'` keeps current R292 absolutes for users who want predictable spacing).
6. Test cases above as unit tests.
7. Ship as r-bump.
