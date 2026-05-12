# Howto — Movie-mode speaker tile

The sofa speaker, with thumb-reach volume + play/pause from the couch.

## What you have

- A `media_player.*` entity exposing volume + play/pause services.
- HA-side media-controls work (you can pause from Developer Tools).

## What you want

A horizontal tile that shows:

- Speaker icon (state-reactive: turns active-orange when playing).
- Speaker name + state ("playing" / "paused" / "idle").
- Volume slider that takes up most of the row.
- − / + buttons for ±5% volume bumps without opening the slider.
- Play/pause button — single-tap toggles between media_play / media_pause.

This is the v2 speaker-row card (P15.6-r31).

## Config

```yaml
type: custom:everyday-light-card
entity: media_player.sofa
slider:
  style: mixer
  show_buttons: true
  orientation: horizontal
```

Save. Test:

1. Drag the slider. Volume changes.
2. Tap −. Volume drops 5 %.
3. Tap +. Volume bumps 5 %.
4. Tap ▶ when paused. Track resumes.
5. Tap ⏸ when playing. Track pauses. Button shows ▶ again.
6. Watch the icon when state changes from paused → playing. The icon background turns active-orange.

## Variants

### You want larger −/+ buttons

The buttons are 32×32 by default in v2 layout. To bump:

```yaml
card_mod:
  style: |
    .speaker-btn { width: 40px; height: 26px; font-size: 18px; }
```

### You want to hide the play/pause button

The button is part of the v2 layout — opt-out by sticking with the v1 layout (no `show_buttons: true` flag). But that drops − / + too. There's no flag to keep ± while hiding ▶/⏸ today; if you need it: file a feature request.

### You want the source picker (Spotify / radio / etc.)

Step-3 deferral. Backlog item: long-press → mode-picker variant for `source_list`. Until shipped, the workaround is `gestures.member_icon.long_press: classic_more_info` which opens HA's stock more-info dialog with the source dropdown.

```yaml
gestures:
  member_icon:
    long_press: classic_more_info
```

## Common gotchas

- **▶/⏸ flips the wrong way.** Some integrations only expose `media_play_pause` (toggle-only). The card uses the explicit branched calls (`media_play` / `media_pause`) for icon-state correctness; if your integration breaks on those, file a bug with the integration name.
- **Volume slider is too sensitive.** HA's volume_set takes 0..1 floats. The slider maps fractions to percentage. Drag distance × screen height = volume change. If your speaker has a small effective range (e.g. 0.0–0.3 sounds reasonable, 0.3+ deafens), use card-mod to clamp the slider's max:
  ```yaml
  card_mod:
    style: |
      everyday-vertical-pill-slider { --everyday-vol-max: 0.5; }
  ```
  (post-shipping enhancement, not yet in core)

## Why this layout

The "row of identical-shape pill controls" pattern reads as a single-purpose unit. Volume slider + ± + ▶/⏸ all visually look like the brightness-slider thumb (same white pill, same drop-shadow, same rounded-rect proportions). The eye groups them; the user doesn't have to think about which is which.

Bubble-Card's design language inspired this — flat, low-decoration, predictable.
