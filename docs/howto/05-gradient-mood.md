# Howto — Dedicated color picker tiles (wheel-only / saved-colors-only)

Sometimes you don't want a slider. You want a tile that's just a color picker — a wall-grid of brand colors, or a full hue wheel that takes up the whole card. Two display modes ship for this:

- `default_view_mode: color-wheel` — entire card body is the color wheel.
- `default_view_mode: saved-colors` — entire card body is the saved-colors palette.

No slider, no icon, no mindmap. Tap a color → light goes to that color.

![Color-wheel mode, saved-colors mode, and the default slider mode side by side](../../assets/screenshots/display-modes-overview.png)

## What you want

A tile on your living-room dashboard that's pure color picking. For example:

- The hue wheel under the couch reading light — your guests can change ambient color without learning anything.
- A 2x4 grid of saved-favourite colors next to the kitchen lights — one tap to "movie mood" / "morning" / "dinner".

## Config — color-wheel mode

```yaml
type: custom:everyday-light-card
entity: light.living_room
default_view_mode: color-wheel
name: Living Room
```

That's it. The card renders as a tile-with-wheel. Tap any segment → `light.turn_on rgb_color: [r, g, b]`.

### Wheel density

Defaults are 6 saturation rings x 21 hues. Override:

```yaml
type: custom:everyday-light-card
entity: light.living_room
default_view_mode: color-wheel
color_wheel:
  type: stepped          # stepped (default) | smooth
  hue_segments: 24       # number of hue arcs around the circle
  saturation_rings: 12   # number of concentric saturation rings
```

Rule of thumb:

- `saturation_rings: 6` (default): balanced saturation grading, white-center disc for easy white pick.
- `saturation_rings: 8` or `12`: wall-poster look, lots of pastels between full saturation and white.
- `saturation_rings: 5` (or fewer): chunky picker for thumb use on a phone. **The white-center disc is suppressed automatically** so the innermost arc remains a selectable low-saturation color rather than being eaten by a tap-to-white blob.
- `type: smooth`: continuous HSV gradient, click maps to polar coords. No discrete grid.

![8 rings x 24 hues, 12 rings, 5 rings (no white center), and smooth](../../assets/screenshots/wheel-variants-grid.png)

## Config — saved-colors mode

```yaml
type: custom:everyday-light-card
entity: light.kitchen
default_view_mode: saved-colors
name: Kitchen
```

The card renders as a tile-with-palette. Tap any swatch → light goes to that color. Default palette is the same 8-color grid the popup picker uses.

### Custom palette

```yaml
saved_colors:
  source: static
  static:
    - [255, 180, 90]    # warm orange
    - [255, 240, 220]   # cream
    - [180, 200, 255]   # cold blue
    - [255, 80, 80]     # coral
    - [255, 220, 100]   # yellow
    - [120, 220, 130]   # mint
    - [100, 160, 240]   # azure
    - [200, 120, 230]   # lilac
```

### Persistent palette (helper-backed)

```yaml
saved_colors:
  source: helper:input_text.living_room_palette
```

The palette syncs to that helper as JSON. Edit-mode (long-press a swatch) adds / removes entries and they persist across reloads.

Without a `source`, the picker writes to HA user_data automatically (since r63a). Edits survive hard-refresh.

## Edit mode (saved-colors only)

Long-press any swatch:

- All swatches wiggle.
- Each gets a small minus button at the top-right — tap to remove.
- A plus cell appears at the end — tap to save the light's **current** rgb to the palette.
- Tap the checkmark to leave edit mode (or tap outside the card).

Re-entering edit mode = another long-press on any swatch.

## When to use each mode

| Use case | Mode |
|---|---|
| Ambient color tile (mood-shifter for one room) | `color-wheel` |
| Quick-tap presets next to a single light | `saved-colors` |
| Brand-color picker for a video/photo studio light | `saved-colors` with `static` palette |
| "Surprise me" picker for a kids room | `color-wheel` with `type: smooth` |
| You want both | Stack two card instances, one per mode |

## Common gotchas

- **My white-only light shows the wheel anyway.** Yes. The card doesn't gate on `supported_color_modes`. The wheel will render, taps will fire `light.turn_on rgb_color`, and your bulb will pick the closest white-ish value (or ignore the call). Don't use these modes on color-temp-only lights — they're for full-color lights.
- **Saved-colors palette is empty.** First-load seeds 8 default colors. If you set `static: []` explicitly, that's an empty config — and edit-mode is the way to populate. Use the `+` cell to save the current light color.
- **Color-wheel center is white when I want a colored center.** Set `saturation_rings: 5` (or any value <= 5). The white-center disc is automatically suppressed, so the inner ring becomes a selectable low-saturation color.

## Why no slider / icon?

These are picker-tiles. The slider+icon view is for control of one light. The wheel-only / saved-only modes are for color **selection** on a light you already know is on at the brightness you want. If you need both, run two card instances side-by-side.

## See also

- [`07-saved-colors-helper.md`](./07-saved-colors-helper.md) — setting up a helper for persistent palettes.
- [`02-bedside-dimmer.md`](./02-bedside-dimmer.md) — the default slider+icon mode for one bulb.
