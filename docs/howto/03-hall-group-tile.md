# Howto — Hall as a single group tile

Most-typical group scenario: a hallway with N ceiling spots that should always behave as one group.

## What you have

- A `light.*` group entity that fans out to your hall spots. Either:
  - HA's standard `group:` integration (`light.hall_spots` resolving to `light.hall_spot_1`, `_2`, `_3`).
  - Or a Hue / Zigbee2MQTT room-group.

If you don't have a group entity yet:

```yaml
# configuration.yaml
light:
  - platform: group
    name: Hall Spots
    unique_id: hall_spots
    entities:
      - light.hall_spot_1
      - light.hall_spot_2
      - light.hall_spot_3
```

Restart HA. `light.hall_spots` now exists.

> **Tip — naming convention for an apartment-wide setup.** If you're
> building the full topology (hall + kitchen + bathroom + apartment-
> master) and already have auto-created zigbee groups, use the
> `everyday_*` prefix on the new helpers (e.g. `light.everyday_hall`,
> `light.everyday_kitchen`, `light.everyday_all`) so your hand-built
> helpers stay clearly separated from any integration-managed groups.
> Full pattern in `09-nested-groups.md`.

## What you want

A single tile in your dashboard. Tap → toggle the whole hall. Long-press → see all 3 spots at once and adjust per-member.

## Config

```yaml
type: custom:everyday-light-card
entity: light.hall_spots
group:
  layout: compact
  full_length_sliders: true       # 260 px slider — visual weight matches the room
  expansion_mode: inline          # long-press expands in-place (default per R131)
```

Save. Test:

1. Tap the icon. All 3 spots toggle. State-restore preserves per-spot brightness on re-on.
2. Drag the slider. All 3 spots scale brightness proportionally (HA's group fan-out).
3. Long-press the icon. The card transforms in-place to show all 3 spots side-by-side, with a master slider on top.
4. Long-press a single spot's icon. Mode-picker for that one spot. Drag → Wheel → release. That one spot turns the picked color (the others stay as they were).

## Variants

### You want the popup-style expand instead of inline

```yaml
group:
  expansion_mode: popup
```

The compact card stays the same size; long-press opens a body-portal popup with the topology. Better when sibling cards are fragile to reflow.

### You want all 3 spots always visible (no compact)

```yaml
group:
  layout: expanded
  full_length_sliders: false   # 220 px sliders — fits more easily in a row
```

No long-press needed; the topology is always shown. More dashboard space, less interaction needed.

### You want color-control over the whole hall (not per-spot)

```yaml
default_view_mode: parallel
parallel_sliders:
  modes: [hue, saturation]
```

This bypasses group-detection. The card renders 2 sliders for `light.hall_spots` itself; HA's group integration fans the service calls out to all 3 spots. Skip the per-spot view entirely.

## Common gotchas

- **Tap-to-on doesn't restore per-member state.** Verify you're on r12 or newer. The `groupToggleWithRestore` snapshot pattern lives in `helpers/group-toggle.ts`.
- **Mindmap arms are invisible on light theme.** R164 fix lives in r15+. Update.
- **Member icons don't reflect HA-customized icons.** R158 (entity-registry icon resolution via `<ha-state-icon>`) lives in r13+. Update.

## Why this layout

Compact + inline-expand is the right answer for "one room, multiple lights, limited tile space" — which is most apartments.

The full topology view (`group.layout: expanded`) is great when you have room (a wall-mounted tablet, a desktop dashboard). The parallel-color view is great for a "mood control" tile. The compact-collapsed-by-default view is what most people want most of the time.
