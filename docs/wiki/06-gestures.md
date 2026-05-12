# 06 — Gestures

The card's interaction vocabulary. Every render-mode and tile-type uses the same gestures, so once you learn them they apply everywhere.

## The 4 primary gestures

| Gesture | What it is | Default action |
|---|---|---|
| **Tap** | Quick down + up under 200 ms | Toggle entity on/off (with state restore for groups) |
| **Long-press** | Down + hold ≥ 200 ms (configurable) | Open mode-picker (4-diamond) |
| **Double-tap** | Two taps within 280 ms | Open color-wheel popup |
| **Press-drag-select** | Long-press + drag onto a picker option without releasing | Pick that option |

The press-drag-select is the most powerful one — it lets you go from idle to a specific mode in a single uninterrupted gesture. Long-press to open the picker, drag your thumb onto Color Wheel or Saved Colors, release. The popup opens centered at the option you released on.

## Where the gestures bind

The card has two gesture-binding sites, with separate config:

- **`gestures.member_icon`** — single-light tile, every member-tile inside a group, the parallel-inline icon, the speaker-row icon.
- **`gestures.group_icon`** — the group-level icon in expanded-group + compact-group + topology-popup layouts.

Both have `tap`, `long_press`, `double_tap`, plus a global `long_press_ms` override on the `gestures` parent.

## Available actions

```yaml
gestures:
  member_icon:
    tap: toggle_with_restore     # default for member tiles
    long_press: mode_picker      # default
    double_tap: color_wheel      # default
```

| Action | Effect |
|---|---|
| `toggle` | Plain `light.toggle` / `media_player.toggle`. |
| `toggle_with_restore` | Same, but for groups also snapshots last per-member state and restores on re-on. |
| `mode_picker` | 4-diamond picker (Brightness / Temp / Wheel / Saved). |
| `color_wheel` | Open color-wheel popup directly (skip picker). |
| `saved_colors` | Open saved-colors popup directly. |
| `effects_list` | Open effects-list-picker as modal (parallel-inline only). |
| `expand_inline` | Compact group → in-place expand to N-slider topology. |
| `expand_overlay` | Compact group → body-portal popup with topology. |
| `classic_more_info` | HA's stock more-info dialog. |
| `cycle_mode` | Single-light: cycle slider mode (brightness → temp → hue → saturation). |
| `none` | Disable this gesture entirely. |

## Tuning the long-press threshold

Default 200 ms. If you're triggering long-press accidentally on tap, bump it:

```yaml
gestures:
  long_press_ms: 280     # global, applies to both member_icon and group_icon
```

If you want long-press to be snappier (some users prefer it), drop it to 150-180 ms.

## Phantom-click suppression

When a popup opens, the card ignores clicks for 300 ms after the open-time. This prevents the gesture that opened the popup (e.g. release-after-double-tap) from immediately closing it. If you find that you have to wait noticeably long after open before you can dismiss, this is why — it's intentional, the alternative was a worse UX bug.

## Which gestures don't work where

Some action / context combinations are no-ops:

- `cycle_mode` on parallel-inline → no-op (every mode is already visible side-by-side, nothing to cycle).
- `expand_*` on parallel-inline → no-op (would require leaving parallel-mode entirely).
- `effects_list` on a light without `attributes.effect_list` → silently no-op (popup self-closes).

These no-ops are intentional and silent. The card stays usable; it just doesn't do the misconfigured thing.

## Press-drag-select walkthrough

Try this on Card 6a (`group.layout: expanded`) member-tile:

1. Long-press a member icon. Mode-picker fades in around the icon — 4 diamond positions: Brightness (top), Temp (right), Wheel (bottom-right), Saved (bottom-left).
2. Without releasing, drag your finger to the Wheel diamond. The card dims everything else and highlights the diamond your thumb is over.
3. Release on the Wheel diamond. The color-wheel popup blooms from that exact position (not from the icon-center) — visually anchored to where your thumb just was.

This is the fastest path from "off" to "I want a specific color" — single gesture, no intermediate taps.
