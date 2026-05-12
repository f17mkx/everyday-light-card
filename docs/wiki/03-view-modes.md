# 03 — View modes

The card has 3 top-level render modes selected via `default_view_mode`:

| Mode | Trigger | Layout |
|---|---|---|
| Slider (default) | no `default_view_mode` | Single vertical pill or per-group expanded view |
| Parallel | `default_view_mode: parallel` | N sliders side-by-side, one per axis |
| Effects-picker | `default_view_mode: effects-picker` | Scrollable list of effect names, no slider |

## Slider mode (default)

The original. Brightness slider, drag to adjust, tap-to-toggle, long-press for mode-picker. When the entity resolves to a group (and `group.layout` is `expanded` — the default for groups), the card auto-expands to show every member with its own slider.

Sub-modes via `slider.orientation` and `slider.style`:

- `vertical` + `pill` (default) — the classic look.
- `horizontal` + `pill` — wall-tile rotation, [icon | slider | name+state].
- `vertical` + `mixer` — fader-style track for media_player volume.
- `horizontal` + `mixer` + `show_buttons: true` — the speaker-row card (Bubble-Card style).

## Parallel mode

Set `default_view_mode: parallel` to render N sliders side-by-side for the same entity, each controlling a different axis. Default modes: `[brightness, temperature, hue, saturation]`. Subset + reorder via `parallel_sliders.modes`.

```yaml
default_view_mode: parallel
parallel_sliders:
  modes: [hue, saturation]
  show_labels: true
  full_length: false
```

Slider height defaults to 220 px (matches expanded-group full_length:false). Set `parallel_sliders.full_length: true` for 260 px when the card sits alone.

Long-press the mindmap-icon → mode-picker (rotate gesture via `gestures.member_icon`). Double-tap defaults to color-wheel; configurable.

## Effects-picker mode

Set `default_view_mode: effects-picker` for lights with non-trivial `attributes.effect_list` (gradient strips, RGB strips with pre-programmed scenes). The card replaces the slider with a scrollable list of effect names. Tap an effect → `light.turn_on effect: <name>`. Long-press the title → edit-mode (drag-reorder, delete, restore).

Optional persistence via `effects_picker.source`:

```yaml
effects_picker:
  source: helper:input_text.everyday_effects_my_light
```

JSON payload `{activeOrder: ["effect1", "effect2", ...]}` round-trips through the helper so the user's custom ordering survives HA restarts and is editable from outside the card.

## Picking the right mode

| Real-life scenario | Mode |
|---|---|
| One light, one slider | Default (slider) |
| One control tile that does everything | Parallel |
| Group of lights, master + per-member access | Default + group:expanded |
| Group of lights, single tile, expand-on-demand | Default + group:compact |
| Color-only control (drop brightness) | Parallel + `modes: [hue, saturation]` |
| Gradient strip with pre-programmed scenes | effects-picker |
| Volume only (no entity-level features) | Default + `slider.style: mixer + show_buttons: true` for the speaker-row |
