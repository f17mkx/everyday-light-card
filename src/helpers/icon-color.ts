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
