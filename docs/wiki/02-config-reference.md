# 02 — Config reference

Every option, with default and effect. Authoritative source: `src/types/config.ts`.

## Top-level

| Key | Type | Default | Effect |
|---|---|---|---|
| `type` | string | required | Always `custom:everyday-light-card`. |
| `entity` | string | required | A `light.*` or `media_player.*` entity_id. |
| `name` | string | entity friendly_name | Card title in the caption. |
| `icon` | mdi-string | from entity-registry | Icon-name override (e.g. `mdi:track-light`). |
| `mode` | enum | by-domain | `'brightness' \| 'temperature' \| 'volume'` for the single-light path. |
| `default_view_mode` | enum | none | `'parallel'` or `'effects-picker'` — switches render-mode entirely. |

## `slider`

Per-slider visual + behavior config.

```yaml
slider:
  width: 47          # px, vertical pill width
  height: 220        # px, vertical pill height (260 for full_length)
  orientation: vertical | horizontal      # default vertical
  style: pill | mixer                     # default pill; mixer = thicker track
  show_buttons: false                     # speaker-row mixer card adds ± + ▶/⏸
  persistent_mode: false                  # remember mode across off→on transitions
```

## `group`

Only honored when the entity resolves to a group.

```yaml
group:
  layout: compact | expanded             # default expanded for groups
  expansion_mode: inline | popup         # default inline (R131); how compact-then-expand works
  full_length_sliders: false             # true → 260 px sliders, false → 220 px
  manual_members:                         # override auto-resolution
    - light.spot_1
    - light.spot_2
```

## `parallel_sliders`

Only honored when `default_view_mode: parallel`.

```yaml
parallel_sliders:
  modes:                                  # subset + order of axes to render
    - brightness
    - temperature
    - hue
    - saturation
  show_labels: true                       # per-slider mode labels above each slider
  full_length: false                      # true → 260 px sliders, false → 220 px (default)
```

## `cycle`

The cycle picker action steps the slider mode forward. Default cycle is
`color_mode`-driven — color_temp lights toggle brightness↔temperature,
color lights step brightness→hue→saturation→brightness. Override with
an explicit ordered list:

```yaml
cycle:
  modes:
    - brightness
    - hue
    - saturation
    - temperature
```

When `cycle.modes` is set, the cycle picker steps through your list in
order, wrapping at the end. Useful when:

- You want a fixed cycle regardless of the entity's reported `color_mode`.
- You only care about a subset of modes (e.g. skip saturation).
- You want a different ordering than the heuristic provides.

Cycle is reachable via:

- The mode-picker's `cycle` slot (left of the icon by default).
- Double-tap on a member tile (when `gestures.member_icon.double_tap` is
  unset or set to `'cycle_mode'`).
- Double-tap on the group icon in compact-group view.

## `gestures`

Bind any gesture event to any action. Each `*_icon` block has `tap`, `long_press`, `double_tap`, plus a global `long_press_ms` to override the 200 ms threshold.

```yaml
gestures:
  long_press_ms: 200
  member_icon:
    tap: toggle_with_restore | toggle | classic_more_info | none
    long_press: mode_picker | color_wheel | saved_colors | effects_list | expand_inline | expand_overlay | classic_more_info | none
    double_tap: color_wheel | saved_colors | effects_list | classic_more_info | toggle | toggle_with_restore | cycle_mode | none
  group_icon: { tap, long_press, double_tap }   # same shape as member_icon
```

## `color_wheel`

```yaml
color_wheel:
  type: stepped | smooth | both           # default stepped
  hue_segments: 12                        # for stepped, default 12
  saturation_rings: 4                     # for stepped, default 4
  persistent: true                        # keep popup open after pick (default true)
```

## `saved_colors`

```yaml
saved_colors:
  static:                                 # 8-cell palette as RGB tuples
    - [248, 141, 42]
    - [255, 250, 234]
    # ... etc
  source: helper:input_text.my_palette    # OR persist to a helper for HA-side editing
```

## `effects_picker`

```yaml
effects_picker:
  source: helper:input_text.my_effects    # JSON `{activeOrder: [...]}` storage
  editable: false                          # default false — opt-in edit-mode flow
```

`editable: false` (the default since P15.6-r49 / R230) keeps the
effects popup a clean pick-only surface. Long-press on an active row
is a no-op. Tap-to-apply still works.

Set `editable: true` to opt into the edit-mode flow:
- Long-press an active row in default mode → enter edit-mode (title gets
  " · edit" suffix + a Done button appears).
- Long-press an active row in edit-mode → remove that effect from the
  active list (greyed-out section appears below).
- Tap a greyed row → restore.
- Tap outside any row → exit edit-mode.

When `editable: true` AND `source: helper:input_text.<id>` is set, the
active-order survives reloads (the host writes a JSON
`{activeOrder: [...]}` payload to the helper after each mutation).
Without `source:`, edits are in-memory only — refresh wipes them. A
zero-config persistence path is tracked as a post-launch follow-up
(see `docs/BACKLOG.md` R230-followup).

## Full-config example (Stefan's apartment)

```yaml
type: custom:everyday-light-card
entity: light.hall_spots
name: Hall
icon: mdi:track-light
group:
  layout: compact
  full_length_sliders: true
  expansion_mode: inline
slider:
  height: 260
gestures:
  group_icon:
    long_press: expand_inline
    double_tap: classic_more_info
saved_colors:
  source: helper:input_text.everyday_hall_palette
```

## When the schema doesn't fit

If you can't express a config in YAML that the card accepts: open a feature request with the desired YAML shape and the real-life scenario it solves. See [`CONTRIBUTING.md`](../CONTRIBUTING.md#feature-requests).
