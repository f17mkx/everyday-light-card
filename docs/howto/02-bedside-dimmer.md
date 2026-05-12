# Howto — Bedside dimmer

The simplest possible card. One light, one slider, one tap to toggle.

## What you have

- A `light.*` entity (smart bulb, bedside lamp, anything).

## What you want

A tile next to the bed. Tap to turn on/off. Drag to dim. Long-press the icon to switch to color-temp mode for warm-light-before-sleep.

## Config

```yaml
type: custom:everyday-light-card
entity: light.bedside_lamp
```

That's it. Defaults handle the rest:

- Vertical pill slider, 220 px tall.
- Brightness mode (drag = brightness 0-100 %).
- Tap toggles on/off.
- Long-press → mode-picker (Brightness / Temp / Wheel / Saved).
- Double-tap → color-wheel popup.

## Variant: dimmer + color-temp side-by-side

If your bedside lamp supports color-temp and you always want both sliders visible:

```yaml
type: custom:everyday-light-card
entity: light.bedside_lamp
default_view_mode: parallel
parallel_sliders:
  modes: [brightness, temperature]
  show_labels: true
```

Two sliders side-by-side, both always visible. Drag either.

## Variant: bigger tile

```yaml
type: custom:everyday-light-card
entity: light.bedside_lamp
slider:
  height: 260
```

260 px slider — same height as the full_length compact-group cards. Makes the tile feel more substantial.

## Variant: night-mode routine integration

If you have a "night mode" automation that dims the bedside lamp gradually as bedtime approaches, this card respects HA state. The slider position auto-updates to reflect the lamp's actual state on every push.

If you want a button on the tile that triggers your night-mode automation: use `gestures.member_icon.double_tap: classic_more_info` to open HA's stock more-info dialog (which can show your automation script as a button), or wrap the card in a `vertical-stack` with a separate `entity-button` for the script.

## Common gotchas

- **Tap-to-on but the lamp doesn't reach previous brightness.** Some integrations don't restore last-brightness on `light.toggle`. The card uses `light.turn_on` (no brightness arg) which lets HA pick — usually 255. If you want explicit restore: use a script.
- **Dragging too sensitive in the dark.** The default `long_press_ms: 200` is fine for thumb-on-glass; for fingertip-in-the-dark, bump to 280 ms via `gestures.long_press_ms: 280` so accidental long-presses don't open the picker.
