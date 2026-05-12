# 01 — Quick start

5-minute onboarding. From "I just installed it" to "my first card is on the dashboard".

## Step 1: install

See [`INSTALLATION.md`](../INSTALLATION.md). Either HACS or manual.

## Step 2: simplest possible card

Edit a Lovelace dashboard, switch to YAML mode, add:

```yaml
type: custom:everyday-light-card
entity: light.living_room
```

Save. The card renders with one brightness slider.

That's it for the simplest case. Drag = brightness. Tap = on/off. Long-press the icon = mode picker.

## Step 3: pick the right layout for your use case

The card has four major layout modes. Match them to your scenario:

| You want | Use | Example |
|---|---|---|
| One light, one slider | default (no special config) | Card 1 in `assets/demo/cards/` |
| All-axis control (brightness + color + temp) | `default_view_mode: parallel` | Card 2 |
| One tile that controls a group of lights | `entity: light.group_x` (auto-detected) | Card 4 |
| Group with all members visible at once | `group.layout: expanded` | Card 6 |
| Volume slider for a speaker | `entity: media_player.x` | Card 7 |

Full reference: [`02-config-reference.md`](02-config-reference.md).

## Step 4: gestures

Every card supports the same gesture vocabulary (no per-card config needed):

| Gesture | Default action |
|---|---|
| Tap | Toggle on/off |
| Drag (vertical or horizontal) | Adjust slider |
| Long-press the icon | Open mode-picker |
| Double-tap the icon | Open color-wheel |
| Long-press, then drag onto a picker option | Pick that mode |

Configure or rotate gestures via `gestures.member_icon.<event>: <action>`. See [`06-gestures.md`](06-gestures.md).

## Step 5: pick a real example

Browse `assets/demo/cards/` for paste-and-go YAML for 15 apartment scenarios (bedside dimmer, hall-group tile, speaker volume, etc.). Each file has inline-comments explaining when you'd pick that config.

## Next steps

- **Configure colors and saved palettes** → [`05-pickers.md`](05-pickers.md)
- **Theme integration** → [`07-theming.md`](07-theming.md)
- **Why isn't my card doing X?** → [`08-troubleshooting.md`](08-troubleshooting.md)
