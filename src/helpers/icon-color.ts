/**
 * Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): shared helper extracted
 * from everyday-light-card.ts so BOTH the card AND the group-layout-
 * expanded component can resolve the optional inline color on their
 * icons (.single-icon, .parallel-mindmap-icon, .tile.group .ic,
 * .tile.member .ic, compact-glyph).
 *
 * Three modes driven by `cfg.icon_color`:
 *
 *   undefined → return '' (no inline style). CSS theming applies — when
 *     `.active` (or `.tile.on`), gold via
 *     `var(--paper-item-icon-active-color, var(--state-light-active-
 *     color, #f88d2a))`; when not, baseline gray. This matches every
 *     other icon on the dashboard, so the card visually fits in. This
 *     is the default.
 *
 *   'on-state' → inline `color: rgba(R, G, B, alpha)` where R/G/B are
 *     the entity's `rgb_color` attribute and `alpha` is brightness
 *     modulated (0.4-1.0). Off, missing rgb_color, or no brightness →
 *     return '' so the CSS fallback applies. Was the r63c default before
 *     r63d reverted it to opt-in.
 *
 *   any other string → inline `color: <string>` regardless of on/off
 *     state. Stefan's reference example: `'var(--active-color)'` for
 *     theme-bound accent styling.
 *
 * In a group context (where this helper is called per-entity), each
 * member tile reads its OWN entity state — so a 5-member group with
 * `icon_color: 'on-state'` renders 5 different colored icons based on
 * each lamp's current RGB. The group icon reads the GROUP entity's
 * aggregate state.
 */
export function computeIconStateColor(
  iconColorCfg: 'on-state' | string | undefined,
  isOn: boolean,
  rgb: [number, number, number] | undefined,
  brightness: number | undefined,
): string {
  if (!iconColorCfg) return '';
  if (iconColorCfg === 'on-state') {
    if (!isOn || !rgb || rgb.length !== 3) return '';
    const alpha = Math.max(0.4, Math.min(1, (brightness ?? 255) / 255));
    return `color: rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)});`;
  }
  return `color: ${iconColorCfg};`;
}

/**
 * Stefan-2026-05-13 PA-0020 (R353): state-aware border colour for the
 * parallel-compact icon ring (`.parallel-compact-icon` border). Pre-R353
 * the border was hardcoded `var(--mindmap-group-stroke, #f4b91d)` — gold
 * regardless of state. Stefan-Quote PA-0020: "der dot um das icon
 * gold/gelb ist (anstatt in state farbe)" — the dot around the icon is
 * gold/yellow (instead of state color).
 *
 * Resolution matches the existing mindmap-path groupStroke logic for
 * `.parallel-mindmap-icon` (group-dot SVG stroke in expanded view) but
 * upgrades the no-RGB on-state fallback from gold to the theme's active
 * icon color (`--paper-item-icon-active-color` → `--state-light-active-
 * color` → orange #f88d2a). This way dim non-color lights also pick up
 * the dashboard accent instead of staying brand-gold.
 *
 * Off state matches the mindmap-path arms FAINT_GRAY (`--disabled-color`)
 * so a non-active group reads as faint without disappearing on light
 * themes (the original gold default was theme-blind).
 *
 * Returns a pure CSS color value (not a `color:` declaration). Caller
 * passes it via an inline custom property: `style=--icon-border-color: X`.
 */
export function computeIconBorderColor(
  isOn: boolean,
  rgb: [number, number, number] | undefined,
): string {
  if (!isOn) return 'var(--disabled-color, rgba(150, 150, 150, 0.55))';
  if (rgb && rgb.length === 3) return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  return 'var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a))';
}
