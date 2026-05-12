# 07 — Theming

The card respects HA's theming system + exposes a few card-specific CSS variables for fine control.

## HA-standard variables (used by the card)

| Variable | Where the card uses it |
|---|---|
| `--card-background-color` | Card chrome background |
| `--primary-text-color` | Title, button labels |
| `--secondary-text-color` | State sub-line, mindmap arms |
| `--state-light-active-color` | "On" state — group-icon halo, speaker icon when playing |
| `--disabled-color` | Mindmap arms in light themes (R164) |

If your theme overrides these, the card will pick them up automatically.

## Card-specific variables

Set these in your theme YAML (Settings → Frontend → Themes) or per-card via `card-mod`:

```yaml
my-theme:
  --everyday-slider-width: 47px
  --everyday-slider-height: 220px
  --everyday-slider-outer-shadow: none      # was --everyday-slider-shadow-y1/y2 (deprecated r15)
  --everyday-thumb-bg: '#ffffff'            # white thumb / white pill buttons
```

The slider's outer drop-shadow is OFF by default (R165, light-theme readability). To get the old "floating pill" look back:

```yaml
my-theme:
  --everyday-slider-outer-shadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
```

## Per-card overrides

`slider.width` and `slider.height` in card config translate directly to inline `--everyday-slider-*` overrides. So per-card customization is YAML, not theme YAML.

```yaml
type: custom:everyday-light-card
entity: light.example
slider:
  width: 60          # wider pill than default 47
  height: 300        # taller than default 220
```

## Light-theme gotchas

- The mindmap-arms used to be a fixed `rgba(255, 255, 255, 0.18)` — invisible on light backgrounds. Post-R164 they use `--disabled-color` so they stay visible across themes.
- The compact-group icon-tile background was `var(--card-background-color)` — resolved to white in light theme and made the icon look like a bright ring. Now `transparent` (R142) so the SVG groupDot fill shows through.

If your custom theme breaks something visually on this card: open an issue with the theme YAML and a screenshot.

## Dark / light auto-switch

The card uses CSS variables, not hardcoded colors, for almost everything. Switching HA between dark and light themes should "just work". If you find a specific element that doesn't adapt: bug report welcome.

## What's NOT customizable

- Mode-picker diamond positions — fixed by `PICKER_ANGLES_BY_VARIANT` in code.
- Mindmap-arm geometry — driven by member-count and slider-height, not configurable.
- Popup-bloom animation timing — 220 ms cubic-bezier, not configurable.

These are intentional UX decisions, not gaps in the config schema. If you have a strong reason to change them: open a feature request.
