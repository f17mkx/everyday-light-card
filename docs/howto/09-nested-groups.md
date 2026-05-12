# Nested groups (recursive embed)

When you have a hierarchy of light groups — apartment-master rolling up
to per-room groups, each with its own ceiling spots — the card can
render the entire topology in one tile.

## Helper groups, not zigbee groups

Most Zigbee integrations auto-create a `light.all` group containing
every bulb in a flat list. That's fine for "turn everything off" but
useless for a topology view — there's no hierarchy. For the nested
pattern below to work, build hand-rolled HA group helpers (here named
`everyday_*` so they don't clash with anything the integration owns):

```yaml
# configuration.yaml
light:
  - platform: group
    name: Everyday All
    unique_id: everyday_all
    entities:
      - light.back              # existing zigbee group OR another helper
      - light.everyday_main     # helper below
  - platform: group
    name: Everyday Main
    unique_id: everyday_main
    entities:
      - light.main_desk_ceiling
      - light.main_tv
      - light.main_mirror
      - light.main_bed
      - light.main_window
      - light.main_sofa
  - platform: group
    name: Everyday Hall
    unique_id: everyday_hall
    entities:
      - light.hall_spots        # itself a group (recursive)
      - light.hall_boxes_2
      - light.hall_door
  - platform: group
    name: Everyday Kitchen
    unique_id: everyday_kitchen
    entities:
      - light.kitchen_ceiling   # itself a group
      - light.kitchen_counter
```

Restart HA. The helpers above become first-class entity_ids that
behave like any other `light.*` group, AND they preserve the nesting
the card needs to render the topology.

## The pattern

```yaml
type: custom:everyday-light-card
entity: light.back            # outermost group
group:
  layout: expanded
  manual_members:
    - entity: light.hall_spots  # sub-group renders as embedded card
      group:
        layout: expanded         # inner card uses its own group config
    - light.kitchen_ceiling      # bare string = legacy flat member
    - entity: light.bath
      slider:
        height: 220              # per-member slider config
```

Each `manual_members` entry is either:

- A bare entity-id string (`light.x`) — renders as a regular slider tile.
- An object with `entity` plus any per-member overrides — renders as
  an embedded `everyday-light-card` with its own group / slider /
  saved-colors / parallel-sliders config. Each level is fully
  independent.

> **YAML gotcha:** inside `manual_members:` you must use either bare
> strings (`- light.hall_spots`) OR the explicit `- entity: light.x`
> form. Don't mix the two ways of writing the same line — `- light.x`
> and `- entity: light.x` are interchangeable for plain members, but
> only the `- entity:` form takes per-member overrides.

## What you get

- The outer mindmap connects the master icon to each member-col.
- Inner sub-groups render their own mindmap arms inside their tile.
- Each level has its own picker, popups, and gesture handling.
- Bare-string members keep the legacy single-light tile behaviour for
  backwards compatibility.

## Limitations (r48 MVP)

- Outer mindmap arms anchor to the member-col edge, not to the inner
  card's group icon. The visual gap between outer-arm tip and
  inner-icon is small but noticeable on dense grids — polish tracked
  in ADR 0005 (post-launch).
- Picker-overlap: when you long-press an outer member tile while an
  inner picker is open, both can show simultaneously. Single-active-
  picker invariant across nesting levels lands post-launch.
- Visual editor exposes only top-level fields. Edit nested members in
  YAML for now.

## Real-life example — Stefan's apartment

The full topology, with helper-groups in **bold**:

```
light.everyday_all
├── light.back                    (existing zigbee group)
│   ├── light.kitchen             (existing zigbee group)
│   │   ├── light.kitchen_ceiling     (zigbee sub-group)
│   │   │   ├── light.kitchen_ceiling_1
│   │   │   └── light.kitchen_ceiling_2
│   │   └── light.kitchen_counter
│   ├── light.bathroom            (existing zigbee group)
│   │   ├── light.bathroom_mirror
│   │   ├── light.bathroom_wall_1
│   │   └── light.bathroom_wall_2
│   └── light.hall                (existing zigbee group)
│       ├── light.hall_spots          (zigbee sub-group)
│       │   ├── light.hall_spot_1
│       │   ├── light.hall_spot_2
│       │   └── light.hall_spot_3
│       ├── light.hall_boxes_2
│       └── light.hall_door
└── light.everyday_main          (helper, see above)
    ├── light.main_desk_ceiling
    ├── light.main_tv
    ├── light.main_mirror
    ├── light.main_bed
    ├── light.main_window
    └── light.main_sofa
```

One card in the dashboard, full topology visible. Tap the master icon
to toggle the whole apartment; long-press any sub-tile to open its
picker; drag any of the inner sliders to control just that branch.

The full YAML for this card is in `assets/demo/dashboard.yaml`
(View 4 — Nested). It uses `manual_members` at every level to mirror
the tree exactly.
