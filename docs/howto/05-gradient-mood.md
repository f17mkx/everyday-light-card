# Howto — Gradient mood (effect-list-picker)

Pick a pre-programmed effect for a gradient strip — fireplace, ocean, lava — without scrolling through HA's stock entity dialog.

## What you have

- A gradient strip light (DreamScreen, gradient Hue, RGB strip with firmware effects, etc.).
- The light's `attributes.effect_list` populates with effect names ("fireplace", "ocean", etc.). Verify in Developer Tools → States → your light → look for `effect_list`.

If `effect_list` is empty: your integration doesn't expose effects. The card can still render the slider; just skip this card-type.

## What you want

A tile that shows a scrollable list of effects. Tap an effect → light starts that effect.

## Config

```yaml
type: custom:everyday-light-card
entity: light.main_heater_2
default_view_mode: effects-picker
```

Save. Test:

1. List of effects renders.
2. Tap "fireplace". Light starts the fireplace effect.
3. Tap "ocean". Light switches to ocean effect.
4. Long-press the title. Edit-mode appears — drag-handle next to each effect, X button to delete.

## Persistent activeOrder (optional)

Without persistence, the card keeps your reordered list in memory only. Reload the dashboard → ordering resets to `effect_list` from the entity.

For persistence, create an `input_text` helper:

1. Settings → Devices & services → Helpers → Create helper → Text → Name "Everyday Effects (main heater)".
2. Note the `entity_id` (e.g. `input_text.everyday_effects_main_heater`).
3. Bump the helper's `max` attribute to 1000+ (Settings → Helpers → ⋮ → Edit). Default 100 chars is too small for a 20+ effect-list JSON.

Then in the card config:

```yaml
type: custom:everyday-light-card
entity: light.main_heater_2
default_view_mode: effects-picker
effects_picker:
  source: helper:input_text.everyday_effects_main_heater
```

Now your reorder + delete actions sync to the helper. JSON payload looks like:

```json
{"activeOrder": ["fireplace", "ocean", "lava", "rainbow"]}
```

You can edit the helper directly via Developer Tools → Services → `input_text.set_value` if you want to script the order externally.

## Variant: effects as double-tap action on a slider card

If you want the slider as the primary control and effects as a secondary surface:

```yaml
type: custom:everyday-light-card
entity: light.main_heater_2
default_view_mode: parallel
parallel_sliders:
  modes: [brightness, hue]
gestures:
  member_icon:
    double_tap: effects_list
```

Now you have brightness + hue sliders + a double-tap shortcut to the effects-list popup. Best of both worlds.

## Common gotchas

- **Reordering doesn't stick.** You forgot the `effects_picker.source`. In-memory only without it.
- **Helper says "max length exceeded".** Bump `max` to 1000+ in the helper's edit dialog.
- **Effect doesn't fire when tapped.** Some integrations need the `effect` argument as a different shape (capital-E, snake_case, etc.). Check Developer Tools → Services → light.turn_on → expand → see what shape the integration accepts. Open a bug if the card and the integration disagree.
