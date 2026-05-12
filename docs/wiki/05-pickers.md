# 05 — Pickers

The card has 4 picker surfaces, each with its own purpose and entry-point.

## Mode picker (4-diamond)

Long-press a member-icon (or group-icon in expanded view) → 4 diamond options fade in around the icon:

- **Top: Brightness** — switch the slider to brightness mode.
- **Right: Temperature** — switch to color-temperature mode.
- **Bottom-right: Wheel** — open color-wheel popup.
- **Bottom-left: Saved** — open saved-colors popup.

Drag onto an option without releasing → press-drag-select. Release → that option fires. Drag back to the icon-center → cancel.

Configure which actions are bound via `gestures.member_icon.long_press: mode_picker` (default). To skip the mode picker and go straight to the wheel:

```yaml
gestures:
  member_icon:
    long_press: color_wheel
```

## Color wheel

Pop-up surface for picking RGB. Two render modes:

- **`stepped`** (default): segmented disc, N hue × N saturation cells. Tap a cell → that color. Configurable via `color_wheel.hue_segments` (default 12) and `color_wheel.saturation_rings` (default 4).
- **`smooth`**: continuous gradient. Drag the dot. Less precise, more painterly.
- **`both`**: render both side-by-side (uncommon, but supported).

Pop-up persists across multiple picks unless `color_wheel.persistent: false`. Click outside → close.

## Saved colors

A 2×4 grid of pre-saved colors. Tap a cell → apply. Long-press the title → edit-mode (delete cells with X, add the entity's current color to a free slot).

Two persistence modes:

```yaml
saved_colors:
  static:                    # static palette in card config
    - [248, 141, 42]
    - [255, 250, 234]
    # ...
```

```yaml
saved_colors:
  source: helper:input_text.my_palette
  # JSON payload `{colors: [[r, g, b], ...]}` stored in the helper.
  # Edits in the card sync to the helper; HA-side edits sync back.
```

If both `static` and `source` are set, `source` wins.

## Effects list picker

Available as:

- A full-card render-mode (`default_view_mode: effects-picker`) — the card IS the picker.
- A popup overlay (`gestures.member_icon.double_tap: effects_list` in parallel-inline mode).

In both cases: tap an effect → `light.turn_on effect: <name>`. Long-press the title → edit-mode (drag-reorder, delete, restore-from-grayed-out section).

## Picker geometry

All popups mount in a body-portal (`document.body`-level element) so they escape HA's transform-ancestor (which would otherwise break `position: fixed`). The portal injects a single style block on first render, shared across every card-instance on the page.

Geometry constants live in `src/helpers/picker-geometry.ts`:

- `PICKER_ORBIT` = 50 — distance from icon-center to diamond-center in px.
- `PICKER_ANGLES_BY_VARIANT` — which 4 angles each variant uses (`'member'`, `'group-compact'`, `'group-expanded'`).

If you're customizing the visual mocks, those are the levers.
