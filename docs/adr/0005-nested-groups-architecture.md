# ADR 0005 — Nested-in-nested groups (recursive rendering)

**Status:** **MVP shipped 2026-05-10 P15.6-r48** (Approach A — recursive embed). Polish items (P21.4 outer-mindmap arms-to-inner-icon, P21.5 cross-level picker registry, P21.6 visual editor) tracked as follow-ups but core nesting works for launch.
**Context:** Stefan-2026-05-10 R208 — feature ask: "1 everyday-light-card for `light.back` with 3 always-expanded sub-groups (hall, bath, kitchen) and kitchen should offer pop-up for `kitchen_ceiling` and hall should offer pop-up (or in-place expansion) for `hall_spots`".

## Context

The card today flat-resolves `entity: light.X` to a single level of members. `light.hall_spots` → `[light.hall_spot_1, light.hall_spot_2, light.hall_spot_3]`. Mindmap connects the group-icon to each member directly.

Stefan's "house" topology is two-level:

```
light.back  (group)
├── light.hall    (group)
│   └── light.hall_spots  (group)
│       ├── light.hall_spot_1
│       ├── light.hall_spot_2
│       └── light.hall_spot_3
├── light.bath    (single light)
└── light.kitchen (group)
    └── light.kitchen_ceiling  (single light)
```

The user wants a single card rooted at `light.back` that:
1. Renders 3 sub-groups (hall / bath / kitchen) as always-expanded.
2. Each sub-group has its own mindmap-arms to ITS members.
3. Per-sub-group: `expansion_mode: popup` (kitchen) OR `inline` (hall).
4. Sub-groups with single members render as a leaf (no further drill-down).

## Decision

Recursive render-tree. Two implementation approaches considered:

### Approach A — Custom-element nesting (RECOMMENDED)

The card recursively instantiates `<everyday-light-card>` for each sub-group:

```html
<!-- light.back -->
<everyday-light-card entity="light.back">
  <!-- rendered output: -->
  <div class="layout">
    <div class="member-cols">
      <!-- each column wraps a child everyday-light-card -->
      <div class="member-col">
        <everyday-light-card entity="light.hall" embedded></everyday-light-card>
      </div>
      <div class="member-col">
        <everyday-light-card entity="light.bath" embedded></everyday-light-card>
      </div>
      <div class="member-col">
        <everyday-light-card entity="light.kitchen" embedded></everyday-light-card>
      </div>
    </div>
    <div class="group-row">
      <!-- light.back's master icon -->
    </div>
  </div>
</everyday-light-card>
```

The `embedded` attribute (new) suppresses the outer `ha-card` chrome + adjusts default-view-mode so a child instance renders as a slider+icon only, not a fully-decorated card.

**Pros:**
- Recursion stops naturally when an entity is a leaf (no members).
- Each level reuses ALL the existing card logic (gestures, popups, mindmap-path).
- Per-level config via the existing config schema — each embedded card receives its own `expansion_mode`, `parallel_sliders`, etc.
- No new code paths to maintain.

**Cons:**
- Each nested card carries its own `setConfig` / state cache. Wasted re-renders unless we share `hass` propagation carefully.
- Mindmap-arms in the OUTER card need to reach to each INNER card's group-icon (not its members). Need new SVG-Y measurement that knows about the inner card's structure.
- Picker overlays at the outer level may overlap with inner level's pickers. Needs z-index discipline + single-active-picker invariant across levels.

### Approach B — Single render-tree with recursive data structure

Internal data model `RenderNode = { entity, members: RenderNode[] }`. Single render function walks the tree producing one big SVG + one big member-cols grid.

**Pros:**
- One state object, no propagation overhead.
- Mindmap-arms can route across all levels in one SVG draw call.

**Cons:**
- Render function balloons in complexity (already 1609 LOC; nested adds ~500 more).
- Picker overlays + popups need per-node identity tracking → state-explosion.
- Per-level config via array-of-config-objects → harder to express in YAML schema.

## Configuration schema

For Approach A, extend `manual_members` from `string[]` to `Member[]`:

```ts
type Member = string | {
  entity: string;
  // Per-level overrides — when omitted, inherit from parent or use defaults.
  group?: GroupConfig;        // for sub-groups: layout, manual_members, expansion_mode
  parallel_sliders?: ParallelSlidersConfig;
  default_view_mode?: ViewMode;
  // ... any of the existing config keys
};
```

Stefan's example:

```yaml
type: custom:everyday-light-card
entity: light.back
group:
  layout: expanded
  manual_members:
    - entity: light.hall
      group:
        layout: expanded
        expansion_mode: inline
        manual_members:
          - light.hall_spots  # auto-resolves to its members at the inner level
    - light.bath  # leaf, just the entity_id string
    - entity: light.kitchen
      group:
        layout: compact
        expansion_mode: popup
        manual_members:
          - light.kitchen_ceiling
```

Backwards-compat: bare `string[]` continues to work — the existing flat-group case.

## Rendering plan (Approach A)

1. **Parent card** detects `light.back` resolves to 3 groups (auto-detect via HA's `attributes.entity_id`, or via `manual_members` if user-set).
2. **Parent renders** its `member-cols` grid. Each column wraps a child `<everyday-light-card>` with the sub-config.
3. **Child cards** with `embedded` attribute:
   - No `<ha-card>` chrome (no outer rounded background).
   - Compact-or-expanded layout per their own config.
   - Their own mindmap-path SVG INSIDE their column.
4. **Parent mindmap** routes from `light.back`'s group-icon to EACH child card's group-icon (need a new "look-up" — child card exposes a `getGroupIconRect()` method).
5. **Picker invariant**: when ANY picker opens (parent OR any child), all others close. Add a `pickerOwner` registry on a shared context (Lit `provideContext` / consume).

## Mindmap arms across levels

The current mindmap-path component renders arms from a single group-dot to N member-dots based on member-cols layout. For nested:

- Outer mindmap: arms from outer-group-dot to each child-card's outer rect (we want the arm tip at the child card's group-icon, not its top-edge).
- Inner mindmap: arms from inner-group-dot to inner members.
- Both render in the same SVG layer (or stacked) without intersecting incorrectly.

Implementation: outer mindmap-path component receives `memberAnchors: { x, y }[]` instead of computing from grid-columns. Each child card publishes its group-icon rect. Outer recomputes arms when child renders.

## Picker single-active invariant across levels

The existing `_closePickersExcept` works within a single card's controllers. For nested, when Stefan long-presses light.kitchen's group-icon, all other pickers (including light.back's parent picker + light.hall's picker) must close.

Implementation: shared `PickerRegistry` via Lit Context. Each card-instance registers its pickers. When one opens, the registry calls `closePicker()` on all others.

## Performance considerations

- Each nested level adds a custom-element instance + ResizeObserver + ReactiveControllers.
- 3-level deep with 3-wide-each = 13 card instances.
- Lit's reactivity is lazy — only nodes whose props changed re-render. Should be fine for typical apartment topologies (≤5 levels, ≤8-wide).

## Migration / back-compat

- Existing flat-group configs (`manual_members: ['light.x', 'light.y']`) continue working unchanged.
- New nested configs use the object-form member entries.
- Config-to-flat-data conversion in the visual editor (R206) handles both forms — the editor only edits the top level + first-level members; deeper nesting stays YAML-only until the editor grows nested-aware.

## Implementation phases (post-launch)

- **P21.1**: extend `manual_members` schema to `Member[]`. Type definitions, config validation. ~30 min.
- **P21.2**: `embedded` mode on `everyday-light-card.ts` — suppresses ha-card chrome + adjusts defaults. ~30 min.
- **P21.3**: recursive render in group-layout-expanded — when a member is itself a group, instantiate child card. ~1h.
- **P21.4**: outer-mindmap arm routing — `memberAnchors` prop, ResizeObserver-driven anchor capture. ~1h.
- **P21.5**: shared PickerRegistry context — single-active-picker across levels. ~1h.
- **P21.6**: visual editor extension — recursive config form for nested members. ~2h.
- **P21.7**: test suite extension — nested-group rendering, picker invariants, anchor accuracy. ~1h.

Total estimate: ~6-8 hours of focused work, spread across 2-3 sessions.

## Alternatives rejected

- **Bridge cards**: each sub-group is its own separate card stacked in a `vertical-stack`. Rejected: loses the topology-mindmap-arms across levels (the visual unification is the killer feature).
- **Vendor `light.area_X` only** (HA areas + categories): rejected because Stefan wants explicit per-tile control of which-lights-which-sub-group, not auto-area-resolution.

## Related

- AUDIT-REFACTOR-PLAN.md §1.5 backlog item R63 (standalone wheel/saved cards) — orthogonal feature.
- `docs/wiki/04-group-layouts.md` — current single-level group docs. Needs an "advanced/nested" section after P21.
