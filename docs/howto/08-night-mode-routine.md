# Howto — Night-mode routine

A bedside / hallway light that shifts cool→warm as bedtime approaches.

## What you have

- A `light.*` entity that supports color_temp_kelvin (most modern smart bulbs).
- An `input_number` helper for the target kelvin (you'll create this).

## What you want

By default the light is at 4500 K (neutral). As time-of-day moves past sunset, the light shifts to 2700 K (warm). Manual override via the temperature slider — but the next automation tick re-applies the time-of-day kelvin.

## Setup

### 1. Create the helper

Settings → Helpers → Create helper → Number → Name "Night Mode Kelvin", min 2200, max 6500, step 100, initial 4500.

Entity_id: `input_number.night_mode_kelvin`.

### 2. The card

```yaml
type: custom:everyday-light-card
entity: light.bedside_lamp
mode: temperature           # default to temp slider
slider:
  height: 220
gestures:
  member_icon:
    long_press: mode_picker
    double_tap: classic_more_info
```

The temp slider shows the current kelvin. Drag to adjust manually.

### 3. The automation (HA-side, not card-side)

```yaml
# automations.yaml
- id: night_mode_kelvin_shift
  alias: Night Mode Kelvin Shift
  trigger:
    - platform: time_pattern
      minutes: '/15'        # every 15 minutes
  action:
    - service: input_number.set_value
      target:
        entity_id: input_number.night_mode_kelvin
      data:
        value: >-
          {% set hour = now().hour %}
          {% if 6 <= hour < 12 %}5500
          {% elif 12 <= hour < 18 %}4500
          {% elif 18 <= hour < 22 %}3500
          {% else %}2700
          {% endif %}
    - service: light.turn_on
      target:
        entity_id: light.bedside_lamp
      data:
        color_temp_kelvin: "{{ states('input_number.night_mode_kelvin') | int }}"
```

Reload automations. Now every 15 minutes the kelvin re-applies based on time-of-day.

## How the manual override works

1. User drags the slider to 2200 K at 3 PM.
2. The card sends `light.turn_on color_temp_kelvin: 2200` immediately.
3. The next 15-min automation tick re-applies whatever the input_number says (4500 K for 3 PM).
4. The override is lost at the next tick.

If you want the override to PERSIST until the next time-window-boundary (e.g. user manual at 3 PM stays until 6 PM when the next preset kicks in), drop the `time_pattern` and use `time:` triggers at specific times instead.

## Variant: parallel-mode for finer control

If you want both brightness and temperature in one tile:

```yaml
type: custom:everyday-light-card
entity: light.bedside_lamp
default_view_mode: parallel
parallel_sliders:
  modes: [brightness, temperature]
  show_labels: true
```

Two sliders side-by-side. Drag either independently.

## Variant: card 15 (the AUDIT-REFACTOR-PLAN demo)

See `assets/demo/cards/15-morning-routine.yaml` for the canonical morning-routine config.

## Common gotchas

- **Slider position lags actual kelvin.** The card reads `attributes.color_temp_kelvin` on every hass push. If your light reports kelvin only after a multi-second transition, the slider follows that delay. Not a card bug.
- **Override persists indefinitely.** Your automation isn't running. Verify in Settings → Automations → trace.
- **Min/max kelvin doesn't match the slider's range.** The card reads `attributes.min_color_temp_kelvin` / `max_color_temp_kelvin` from the entity. If your integration reports wrong values, the slider's range is wrong. Workaround: card-mod a min/max override, or fix the integration upstream.
