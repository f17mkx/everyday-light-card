# Configuration Reference

All configuration options for `custom:everyday-light-card`. Required: `type` + `entity`. Everything else is optional with sensible defaults.

## Minimal example

```yaml
type: custom:everyday-light-card
entity: light.living_room
```

## Table of contents

- [Top-level options](#top-level-options)
- [`group`](#group) - group config (members, layout, mindmap, expansion)
- [`slider`](#slider) - slider sizing, orientation, style
- [`parallel_sliders`](#parallel_sliders) - multi-axis side-by-side rendering
- [`saved_colors`](#saved_colors) - color palette persistence
- [`color_wheel`](#color_wheel) - color picker geometry
- [`effects_picker`](#effects_picker) - effect-list picker
- [`cycle`](#cycle) - double-tap cycle order
- [`gestures`](#gestures) - per-icon gesture mapping
- [`classic_mode`](#classic_mode) - HA more-info fallback
- [Examples](#examples)

---

## Top-level options

| Option | Type | Default | Notes |
|---|---|---|---|
| `type` | string | required | Always `custom:everyday-light-card` |
| `entity` | string | required | `light.*` or `media_player.*` entity id |
| `mode` | string | (auto) | Initial slider mode. Light: `brightness`. Media-player: `volume`. Manual override: `brightness`, `temperature`, `volume` |
| `default_view_mode` | string | `collapsed` | Top-level render path. Values: `collapsed`, `parallel`, `effects-picker`, `color-wheel`, `saved-colors` |
| `name` | string | (HA friendly_name) | Display label |
| `icon` | string | (HA default) | MDI icon override (e.g. `mdi:ceiling-light`) |
| `icon_color` | string | (theme gold) | `on-state` reflects entity RGB and brightness. Any CSS color string is used literally (e.g. `var(--accent-color)`, `#ff5500`) |
| `parent_node` | string | `show` | Set to `hide` to drop the parent group-row in expanded view (only members render) |
| `show_icons` | boolean | `true` | Set `false` to hide all icons (members + parent). Labels remain |
| `show_mindmap` | boolean | `true` | Set `false` to hide the SVG arms + dots between members and parent |

### `default_view_mode` values

- **`collapsed`** (default): single slider + group icon (or single-light icon).
- **`parallel`**: N parallel sliders inline, no popup. Modes driven by `parallel_sliders.modes`.
- **`effects-picker`**: card becomes a dedicated effects-list tile. No slider, no icon. Source from the entity's `effect_list`.
- **`color-wheel`**: card becomes a standalone color wheel tile. Geometry from `color_wheel`. Tap a sector to set color.
- **`saved-colors`**: card becomes a standalone saved-colors palette tile. Persistence via `saved_colors.source`.

---

## `group`

For groups of lights. Auto-detected if `entity` is a group entity; required if you want to define members manually or override the default group behavior.

| Option | Type | Default | Notes |
|---|---|---|---|
| `manual_members` | list | (auto) | Bare entity-ids OR `{entity, ...overrides}` objects for nested groups |
| `layout` | string | `auto` | `expanded` (N sliders + group icon), `compact` (1 slider + icon), `auto` |
| `mindmap` | boolean | `true` | Show mindmap-path SVG between members and parent |
| `mindmap_dots` | boolean | (auto) | Colored dots around icons. Auto-true when `icon_position: bottom`, auto-false when `top` |
| `icon_position` | string | `bottom` | `top` anchors the group-icon Y across compact ↔ expanded transitions |
| `restore_strategy` | string | `scene_snapshot` | `scene_snapshot` = exact per-member restore via `scene.create` + `scene.turn_on`. `last_state` = rely on HA's built-in last-state restoration |
| `full_length_sliders` | boolean | `false` | `true` makes expanded member sliders match single-light height (260 px). Affects the popup/expanded view only |
| `expansion_mode` | string | `inline` | `inline` reflows siblings in the dashboard; `popup` opens a body-portal overlay |
| `expand_in_place` | boolean | `false` | Card height stays constant on compact ↔ expanded transitions. Member sliders shrink to absorb the topology arms |
| `expansion_sticky` | boolean | `false` | Expanded state persists across page reloads via `localStorage`. The long-press picker gets a "Collapse" option to fold the card back |

### `manual_members` shapes

```yaml
group:
  manual_members:
    - light.bath           # bare entity-id (legacy)
    - entity: light.kitchen   # object form with per-member overrides
      group:
        layout: compact
        expansion_mode: popup
```

Each nested-object entry can carry its own `group`, `parallel_sliders`, `saved_colors`, etc. Useful for apartment-wide topologies where each room behaves differently.

---

## `slider`

| Option | Type | Default | Notes |
|---|---|---|---|
| `width` | number | (auto) | Pill width in px. Default 47 in group views, 60 single-light |
| `height` | number | (auto) | Pill height in px. Default 170 in topology-popup, 220 in single-light or expanded group |
| `orientation` | string | `vertical` | `horizontal` for flat layouts (media-player volume) |
| `style` | string | `pill` | `mixer` = DJ-fader look. Currently only meaningful with `orientation: horizontal` |
| `show_buttons` | boolean | `false` | Media-player only: adds `−` / `+` buttons that call `media_player.volume_down` / `_up` |
| `persistent_mode` | boolean | `false` | Slider mode persists across off → on. Default reverts to `brightness` |

---

## `parallel_sliders`

Multi-axis side-by-side rendering. Triggered by `default_view_mode: parallel` or the member-icon long-press → "Parallel" picker option.

| Option | Type | Default | Notes |
|---|---|---|---|
| `modes` | list | `[brightness, temperature, hue, saturation]` | Subset and order |
| `show_labels` | boolean | `true` | Per-slider mode label above each slider |
| `full_length` | boolean | `false` | `true` = 260 px tall, `false` = 220 px |
| `layout` | string | `expanded` | `compact` drops the mindmap SVG + orbiting icon overlay. Use when embedded inside a parent's topology |

---

## `saved_colors`

| Option | Type | Default | Notes |
|---|---|---|---|
| `source` | string | (HA user_data) | `ha_favorites`, `helper:input_text.<id>`, or `static`. Unset = persistence in HA's native user-data store (zero-config) |
| `static` | list | - | RGB triples like `[[255, 0, 0], [0, 255, 0]]`. Only used when `source: static` |
| `persistent` | boolean | `true` | Popup stays open after picking a color. `false` = auto-close after first pick |

### Source semantics

- **(unset)**: zero-config, HA persists per-user.
- **`ha_favorites`**: reads/writes HA's built-in `favorite_colors` entity-registry option.
- **`helper:input_text.my_palette`**: JSON list in the helper. Helper's `max` should be ≥ 255.
- **`static`**: list defined in YAML via the `static` field. Read-only at runtime.

---

## `color_wheel`

| Option | Type | Default | Notes |
|---|---|---|---|
| `type` | string | `stepped` | `stepped`, `smooth`, or `both` |
| `hue_segments` | number | `21` | Stepped only. Number of hue sectors |
| `saturation_rings` | number | `6` | Stepped only. Number of saturation rings. With ≤5 rings the white-center disc is auto-suppressed so the inner ring stays selectable |
| `persistent` | boolean | `true` | Popup stays open after picking a color |

---

## `effects_picker`

For lights whose entity exposes an `effect_list`.

| Option | Type | Default | Notes |
|---|---|---|---|
| `source` | string | (in-memory) | `helper:input_text.<id>` for persistence across reloads. Without a source, edits are lost on refresh |
| `editable` | boolean | `true` | Long-press on an active effect-row enters edit mode (delete / restore) |
| `in_picker` | boolean | `false` | Show the effects-slot in the long-press mode-picker. Default off since v1.0.2 (every color bulb has an `effect_list`, so the slot was too noisy). Opt-in per-card |

---

## `scenes_picker`

Drives the `scenes_list` gesture action. By default the card auto-discovers every `scene.*` entity whose `entity_id` attribute intersects the target light's leaves — most Hue / Zigbee bridges set this attribute automatically when scenes are favourited in the app. Set `scenes` to override with a curated list.

| Option | Type | Default | Notes |
|---|---|---|---|
| `scenes` | list of `scene.*` ids | (auto-discover) | Explicit override. When set, replaces the auto-intersection entirely. Use when auto-discovery surfaces unwanted scenes (e.g. global "all lights" scenes that touch every bulb) or when you want a short curated list per card |
| `source` | string | (in-memory) | `helper:input_text.<id>` for persistence of the curated active-order across reloads. JSON payload `{ activeOrder: [sceneId, ...] }`. Without a source, edits are in-memory only and lost on refresh |
| `transition` | number (seconds) | `0.4` | Passed to `scene.turn_on`. `0` for instant snap, larger for a smoother fade |
| `name_strip_prefix` | boolean | `true` | Strip the light's friendly_name from the start of each scene name. "Wohnzimmer Konzentriert" → "Konzentriert" when the card targets `light.wohnzimmer`. Set `false` to keep the full name |
| `editable` | boolean | `true` | Long-press on an active scene-row enters edit mode (hide / restore). Set `false` to suppress the edit path for a strict pick-only surface (e.g. a guest tablet) |
| `in_picker` | boolean | `false` | Reserved for future mode-picker slot. Not wired yet — wire the action via `gestures.member_icon.double_tap` or `gestures.group_icon.double_tap` instead |

### Example: Hue scenes on a room-light double-tap

```yaml
type: custom:everyday-light-card
entity: light.wohnzimmer
gestures:
  group_icon:
    double_tap: scenes_list
# Optional override — without this, every scene that targets a wohnzimmer
# leaf light is auto-discovered.
scenes_picker:
  scenes:
    - scene.wohnzimmer_konzentriert
    - scene.wohnzimmer_entspannen
    - scene.wohnzimmer_lesen
  transition: 0.4
```

---

## `cycle`

Override the double-tap cycle order.

| Option | Type | Default | Notes |
|---|---|---|---|
| `modes` | list | (auto from `color_mode`) | Explicit ordered list of slider modes the cycle steps through |

Default behavior: a color-temp light cycles `brightness ↔ temperature`. A color light cycles `brightness → hue → saturation → brightness`. Override with `cycle.modes: [brightness, hue, saturation, temperature]` (or any subset / order).

---

## `gestures`

Per-icon gesture mapping. Each icon (member, group) can map `tap`, `long_press`, and `double_tap` to any [gesture action](#gesture-actions).

| Option | Type | Default | Notes |
|---|---|---|---|
| `long_press_ms` | number | `200` | Press-and-hold threshold for both icon types |
| `member_icon.tap` | string | (varies) | See actions below |
| `member_icon.long_press` | string | `mode_picker` | |
| `member_icon.double_tap` | string | `cycle_mode` | |
| `group_icon.tap` | string | `toggle_with_restore` | |
| `group_icon.long_press` | string | `mode_picker` | |
| `group_icon.double_tap` | string | (varies) | |

### Gesture actions

- `none` - no-op
- `toggle` - basic `light.toggle` (no state-restore on re-on)
- `toggle_with_restore` - on toggle-off, snapshot state via `scene.create`; on toggle-on, exact-restore
- `mode_picker` - long-press picker (4-diamond layout with brightness / temp / wheel / saved-colors)
- `saved_colors` - opens the saved-colors palette
- `expand_overlay` - expand topology in a popup overlay
- `expand_inline` - expand topology in-place (sibling cards reflow)
- `expand_inline_parallel` - expand to parallel-axis sliders for a leaf entity
- `classic_more_info` - opens HA's native more-info dialog
- `color_wheel` - opens the color wheel
- `cycle_mode` - cycles slider mode (see [`cycle`](#cycle))
- `effects_list` - opens the effects-list picker
- `scenes_list` - opens the scenes-list picker. Lists every `scene.*` entity whose `entity_id` attribute intersects this light's leaves. Tap a scene → `scene.turn_on`. Override the auto-discovery via [`scenes_picker.scenes`](#scenes_picker).

### Example

```yaml
gestures:
  long_press_ms: 350
  member_icon:
    tap: toggle
    long_press: color_wheel
    double_tap: cycle_mode
```

---

## `classic_mode`

Fall back to HA's native more-info dialog for users who prefer the standard light-card UI.

| Option | Type | Default | Notes |
|---|---|---|---|
| `enable` | boolean | `false` | Allow `classic_more_info` as a gesture action |
| `use_for_tap` | boolean | `false` | Single-tap opens HA's more-info dialog (overrides the default no-op tap) |

---

## Examples

### Single light, 4-axis parallel view

```yaml
type: custom:everyday-light-card
entity: light.living_room
default_view_mode: parallel
parallel_sliders:
  modes: [brightness, temperature, hue, saturation]
```

### Compact group with sticky expand-in-place

```yaml
type: custom:everyday-light-card
entity: light.kitchen_group
group:
  layout: compact
  expand_in_place: true
  expansion_sticky: true
```

### Standalone color-wheel tile

```yaml
type: custom:everyday-light-card
entity: light.bedroom
default_view_mode: color-wheel
color_wheel:
  type: stepped
  hue_segments: 24       # denser than default 21
  saturation_rings: 8    # more saturation steps than default 6
```

### Row of sliders only (no icons, no mindmap)

```yaml
type: custom:everyday-light-card
entity: light.hall_group
group:
  layout: expanded
parent_node: hide
show_icons: false
show_mindmap: false
```

### Media-player volume with mixer style and buttons

```yaml
type: custom:everyday-light-card
entity: media_player.living_room
slider:
  orientation: horizontal
  style: mixer
  show_buttons: true
```

### Nested apartment topology

```yaml
type: custom:everyday-light-card
entity: light.apartment_all
group:
  layout: expanded
  manual_members:
    - entity: light.kitchen_group
      group:
        layout: compact
        expand_in_place: true
    - entity: light.hall_group
      group:
        layout: compact
    - entity: light.bedroom
      default_view_mode: parallel
      parallel_sliders:
        modes: [brightness, temperature]
```

Each nested member carries its own config, so different rooms can use different layouts inside the same apartment view.
