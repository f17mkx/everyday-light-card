# Howto — One-tap house-off shortcut

The "I'm leaving" tile. Tap once → every light in the apartment off, with state-restore on next on-tap.

## What you have

- A `light.all` group, or equivalent, that includes every light you want to control.
- HA's `group:` integration (or a HACS group manager).

If you don't have `light.all` yet:

```yaml
# configuration.yaml
light:
  - platform: group
    name: Everyday All
    unique_id: everyday_all
    entities:
      - light.main
      - light.kitchen
      - light.hall_spots      # group-of-groups works
      - light.bathroom
```

Restart HA. `light.everyday_all` now exists.

Note: `entities:` is the HA group-platform key — every member is a bare
entity-id string here. The card's own `manual_members:` config uses the
`- entity: light.X` pattern for nested per-member overrides (see
`09-nested-groups.md`). Don't mix the two.

## What you want

A single tile near the apartment door. Tap → all lights off. The tile also shows an at-a-glance "is anything still on" via the master-brightness slider position.

## Config

```yaml
type: custom:everyday-light-card
entity: light.everyday_all
name: House
icon: mdi:home-lightbulb
group:
  layout: compact
  full_length_sliders: true
  expansion_mode: inline
slider:
  height: 260
gestures:
  group_icon:
    long_press: expand_inline    # default — long-press opens topology
    double_tap: classic_more_info
```

> **Why `light.everyday_all`, not `light.all`?** On Zigbee setups
> `light.all` is auto-managed by the integration and is a flat list of
> every bulb. For an apartment-wide tile you usually want the
> hierarchical topology (back + main → rooms → fixtures), which means
> a hand-built helper group. The `everyday_*` naming keeps the helpers
> separate from any zigbee-auto-groups. See `09-nested-groups.md` for
> the full apartment example.

Save. Test:

1. Tap the icon. Every light turns off. The slider drops to 0.
2. Tap again. Every light comes back on at its previous brightness (state-restore).
3. Long-press the icon. The card transforms in-place to show every group-member with its own slider.
4. Drag the master slider. Every light scales proportionally.
5. Double-tap the icon. HA's stock more-info dialog opens for `light.everyday_all`.

## Variant: dashboard-wide tile

If you want this tile to span the full width of a dashboard view (less precision, more visual weight):

Wrap in a `grid` card or set `full_length_sliders: true` with explicit `slider.height`. The default 260 + `full_length:true` already makes it taller than most cards; for full-width drama, use a `vertical-stack` with a label header above:

```yaml
type: vertical-stack
cards:
  - type: markdown
    content: "## House"
  - type: custom:everyday-light-card
    entity: light.everyday_all
    icon: mdi:home-lightbulb
    group:
      layout: compact
      full_length_sliders: true
```

## Variant: leaving-the-house automation trigger

You can fire an HA automation from the tile in addition to the toggle. Two paths:

### Use a script + the card's tap action

Set `gestures.group_icon.tap: classic_more_info`. Add a "Leaving" button to the more-info dialog via a custom view or panel. Less seamless but works today.

### Use a node-red flow listening on `light.everyday_all` state-change

When `light.everyday_all` transitions to `off`, run your "I'm leaving" sequence (lock the door, set thermostat, arm alarm). The card stays simple; the side-effect lives in HA.

This is the better long-term pattern — keep the card UI minimal, put the logic in HA.

## Common gotchas

- **State-restore is approximate for groups.** HA's `light.toggle` on a group records the on-states in a snapshot, but if a member changes color while the group is "off" (rare but possible), the restore may not reproduce that exact state. For mission-critical state preservation: use a custom script + `scene.create + scene.apply`.
- **`light.everyday_all` doesn't include media_players.** If you want "everything off including the speaker": add a separate media_player.* tile (Card 7) and tap it after the lights tile. Or write a script that does both and bind it to the lights tile via `tap: classic_more_info` workflow.
