# everyday-light-card — demo card matrix

Reference configs for the 15 apartment scenarios in `docs/AUDIT-REFACTOR-PLAN.md` §4.1. Stefan's Munich apartment (Luisenstraße 60a) is the canonical setup — every card maps to a real-life "I want to do X" situation.

## Quick start

Drop the YAML below into your dashboard's raw-config (Settings → Dashboards → ⋮ → Edit YAML). The cards reference Stefan's real entities (`light.main`, `light.hall_spots`, `media_player.sofa`, etc.) — swap to your own entity_ids before saving.

```yaml
# Single-light bedside dimmer — Card 1
type: custom:everyday-light-card
entity: light.hall_spot_1
```

## Card catalogue

| # | Card file | Scenario | Status |
|---|---|---|---|
| 1 | `cards/01-bedside-dimmer.yaml` | Bedside lamp, brightness only | shipped |
| 2 | `cards/02-default-parallel-4axis.yaml` | All-axis tile by the door | shipped |
| 3 | `cards/03-mood-light-side-tile.yaml` | Hue + saturation only | shipped |
| 4 | `cards/04-compact-group.yaml` | Hall (3 spots) — single tile | shipped |
| 5 | `cards/05-compact-group-fulllength.yaml` | Hall, longer slider | shipped |
| 6 | `cards/06-expanded-group.yaml` | Hall — full topology view | shipped |
| 6b | `cards/06b-group-parallel.yaml` | Hall — color-control | shipped |
| 7 | `cards/07-mixer-fader-speaker.yaml` | Sofa speaker volume + ± + ▶/⏸ | shipped (r31 v2) |
| 8 | `cards/08-horizontal-pill.yaml` | Floor-lamp wall-tile | shipped |
| 9 | `cards/09-effects-list-gradient.yaml` | Gradient strip — pick scene | shipped |
| 10 | `cards/10-all-house-master.yaml` | One-tap house-off | NEW (r31, P15.6) |
| 11 | n/a | Compact group with mindmap-arm | shipped P15.6-r7 (R82 fix) |
| 12 | n/a | Default-parallel + working picker | shipped P15.6-r10 (R80 fix) |
| 13 | `cards/13-saved-colors-only.yaml` | Pick mood color, no slider | NEEDS R63 (P21) |
| 14 | `cards/14-color-wheel-only.yaml` | Pure color-pick tile | NEEDS R63 (P21) |
| 15 | `cards/15-morning-routine.yaml` | Time-of-day-aware main light | NEW (r31, P15.6) |

## Apartment-scenario stories

Maps to `docs/howto/` cookbook chapters (P18 phase). Each card answers a real "I want X" the user has at home.

1. **Bedside dimmer** (Card 1): single brightness slider for the bedside lamp. Tap-to-toggle, long-press to switch to color-temp.
2. **Make-it-cozy** (Card 2): all-axis tile by the door. Walk in, eyeball, drag any axis.
3. **Hall in 1 tile** (Card 4): three spots controlled as a compact group. Long-press for topology.
4. **Movie-time speaker** (Card 7): sofa volume with ± + ▶/⏸ for couch-distance control.
5. **Gradient mood** (Card 9): pick a fireplace effect for the heater strip in evening.
6. **All-off shortcut** (Card 10): one-tap house-off before leaving.
7. **Wake-up routine** (Card 15): color-temp shifts as the morning progresses; helper-driven kelvin override.

## Mock-hass demo site (P17 deliverable)

Deferred to P17 phase: `assets/demo/mock-hass/` will host a static HTML page with an embedded mock-`hass` object so reviewers can interact with every card variant without a real HA install. GH Pages deploy planned at `f17mkx.github.io/everyday-light-card`.

Until then, see the per-card YAML in `cards/` for paste-and-go configs.
