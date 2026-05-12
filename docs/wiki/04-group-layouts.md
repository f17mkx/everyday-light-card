# 04 — Group layouts

Groups (HA `group:` integration's `light` group, or `manual_members`) get two layout choices: `compact` and `expanded`.

## Detection

When you set `entity:` to a `light.*` entity that is a group, the card auto-detects via:

1. `group.manual_members` if you set it (overrides everything).
2. `attributes.entity_id` on the state object (HA-native group composition).
3. Falls back to single-light if neither resolves.

Whichever members the card resolves become the cells in the topology view.

## `expanded` (default for groups)

Every member gets its own slider, plus a master slider at the top. Mindmap-path SVG connects the master to each member visually.

```yaml
entity: light.hall_spots
group:
  layout: expanded
  full_length_sliders: false   # default; sliders 220 px
```

Per-member: long-press → mode-picker, tap → toggle that single light, drag the slider → adjust just that member. Drag the master slider → adjust ALL members proportionally (HA's group fan-out handles this).

## `compact`

A single tile with one master slider + a small mindmap-arm below the slider hinting at the member topology.

```yaml
entity: light.hall_spots
group:
  layout: compact
  full_length_sliders: true     # 260 px slider for visual weight
  expansion_mode: inline        # default; long-press expands in-place
```

### `expansion_mode: inline` (default, R131)

Long-press the group-icon → the compact card transforms in-place into the N-slider expanded view. Sibling cards reflow around the new height. Animations are smoother than popup-mode.

### `expansion_mode: popup`

Long-press the group-icon → a body-portal popup mounts at the same on-screen position as the original card, sized to fit the topology. Click outside → close.

Use `popup` when the surrounding dashboard layout is fragile (custom-grid card, picture-elements) and you don't want sibling cards to reflow.

## `full_length_sliders`

Default `false`: master slider 220 px, group-icon stays in its low position regardless of expand/collapse.

`true`: master slider 260 px (matches the card's compact slider when also full-length). Group-icon shifts position when the card expands. Use when:

- The card sits in a row of full-length compact-cards and you want the heights to match.
- You want maximum visual weight for the master slider.

## Mindmap math

The SVG mindmap-arm renders curves from each member's slider-bottom to the group-icon-center. Calibration constants in `_renderTopologyTree` shift with `effectiveSliderHeight` so the dot-positions stay aligned regardless of slider-length.

If you see the mindmap-dot floating above or below the icon, it's a slider-height issue — either set `slider.height` explicitly to 220 / 260 or check `full_length_sliders`. Recent changelog entries (P15.6 r16-r27) detail the alignment math.

## When NOT to use a group card

- **You want axis-control on a group** (color-pick the entire hall) — use `default_view_mode: parallel` instead. Service calls fan out via HA's group integration; you don't need per-member sliders to color-pick a group.
- **You only ever interact with one member** — just use that member's entity directly. The card's auto-detect tries to be smart but if you have a 5-member group and only ever touch member 3, simpler config wins.
