# Howto — Saved colors via input_text helper

Persist your saved-colors palette across HA restarts and edit it from outside the card.

## What you have

- An entity using the card with `saved_colors` enabled (default 8-cell palette).

## What you want

A persistent palette where:

- Edits in the card UI sync to a helper.
- Edits to the helper (e.g. via Developer Tools or a script) sync back to the card.
- The palette survives HA restarts.

## Setup

### 1. Create the helper

Settings → Devices & services → Helpers → Create helper → Text → Name "Everyday Palette (main)".

Note the `entity_id`. Default is something like `input_text.everyday_palette_main`.

### 2. Bump the helper's max length

Default 100 chars is too small for an 8-color palette JSON.

Settings → Helpers → click the helper → ⋮ → Edit → Maximum length → 500.

500 chars is plenty for 8-16 colors as JSON.

### 3. Wire to the card

```yaml
type: custom:everyday-light-card
entity: light.main
saved_colors:
  source: helper:input_text.everyday_palette_main
```

If `static` and `source` are both set, `source` wins.

## Storage format

The helper stores a JSON object:

```json
{"colors": [[248, 141, 42], [255, 250, 234], [200, 220, 255], ...]}
```

Each tuple is `[r, g, b]` 0-255. Up to 16 entries supported (the UI shows 8 in a 2×4 grid; if you store more, only the first 8 render).

## Editing from outside the card

### Via Developer Tools

Developer Tools → Services → `input_text.set_value`:

```yaml
service: input_text.set_value
target:
  entity_id: input_text.everyday_palette_main
data:
  value: '{"colors":[[255,0,0],[0,255,0],[0,0,255]]}'
```

Submit. The card updates on the next state push.

### Via a script

Define a script that builds the palette dynamically:

```yaml
# scripts.yaml
update_morning_palette:
  alias: Update Morning Palette
  sequence:
    - service: input_text.set_value
      target:
        entity_id: input_text.everyday_palette_main
      data:
        value: >-
          {"colors": [
            [255, 220, 90],
            [255, 180, 60],
            [200, 150, 90],
            [255, 250, 234]
          ]}
```

Run the script (manually or from automation) → palette refreshes.

### Via node-red

Listen on `state_changed` of the helper, fire `input_text.set_value` with computed colors. Useful for time-of-day palettes (pastels in the morning, warm tones in the evening).

## Workflow tip

Keep one palette per "context" rather than one global palette. E.g.:

- `input_text.everyday_palette_living_room` — warm tones for the main light.
- `input_text.everyday_palette_bedroom` — cool tones for the night-mode lamp.
- `input_text.everyday_palette_party` — neon RGB for special occasions.

Wire each to its respective card. Easier to maintain than one mega-palette.

## Common gotchas

- **JSON didn't parse.** The card silently ignores invalid JSON. Verify in Developer Tools → States → your helper → state should be valid JSON.
- **Edits in card don't reach helper.** Verify `source: helper:input_text.<id>` matches an existing helper, the helper's max-length is large enough, and HA's state-history shows the input_text value updating after card edits.
- **Helper-edit doesn't reach card.** Hard-refresh. The card reads the helper on every hass push, so this should be sub-second; if it's not, the read-cache might be stale on a stuck connection.
