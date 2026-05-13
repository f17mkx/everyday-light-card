/**
 * picker-geometry - shared geometry helper for the mode-picker.
 *
 * Phase 14 (2026-05-09): extracted from group-layout-expanded.ts so that
 * everyday-light-card.ts (parallel-inline picker) and group-layout-
 * expanded.ts (member + group pickers) share ONE implementation of the
 * press-drag-select hit-test. Stefan-Direktive 2026-05-09: "1
 * implementation für alle".
 *
 * Stefan-2026-05-10 P15.6-r38 (R203 + R204): refactored from per-variant
 * fixed-angle bands to dynamic-count circular distribution. Old approach
 * had angles hardcoded per variant — new picker slots ('cycle', 'effects')
 * weren't in any band so they never highlighted on press-drag. New
 * approach computes uniform angles based on the actual rendered slot
 * list (4 cardinals when n=4, pentagon when n=5, etc.) and the
 * hit-detection picks the NEAREST slot to the pointer's angle.
 *
 * Variant cheat-sheet (post-r38):
 *   'member' / 'group-compact' / 'group-expanded': all 4-diamond by
 *     default (parallel/saved/wheel/cycle), pentagon when hasEffects.
 *   'group-expanded' + omitTemp legacy: 2-option (wheel right, saved left).
 */

import type { PickerMode, PickerVariant } from '../components/mode-picker.js';

const DEAD_ZONE_R = 18;
const PICKER_REACH_R = 160;

/**
 * Picker-dot orbit radius (px). Kept in sync with `mode-picker.ts`
 * ORBIT_R = 64. Distance from icon-center to each option-dot.
 */
export const PICKER_ORBIT = 64;

/**
 * Options for the angle-map / hit-detection family. Both helpers need
 * the same `(variant, hasEffects, omitTemp)` signature so the picker's
 * rendered slots match the dot positions match the hit-detection.
 */
export interface PickerLayoutOpts {
  hasEffects?: boolean;
  /** Legacy 2-option group-expanded mode (deprecated 2026-05-09 P40). */
  omitTemp?: boolean;
  /**
   * Stefan-2026-05-11 R238: when true, the 'parallel' slot is replaced
   * with the 'mindmap' (expand-group) slot. Used for compact-group
   * pickers on embedded nested-group cards where 'parallel' doesn't
   * make sense as the primary action — the user wants to expand the
   * sub-group, not open a same-entity parallel-sliders popup.
   */
  useMindmap?: boolean;
  /**
   * Stefan-2026-05-11 R290 (PA-14): when true, the 'mindmap' slot is
   * APPENDED to the regular slot list (alongside parallel/saved/wheel/
   * cycle) instead of replacing parallel. Used for standalone-compact
   * group cards where the user wants both parallel-popup AND mindmap-
   * expand as available actions. Default: 5 slots `[parallel, saved,
   * wheel, cycle, mindmap]`; 6 slots with effects. Mutually-exclusive
   * with `useMindmap` (would double-count mindmap); when both true,
   * useMindmap wins (kept for the embedded path's existing behavior).
   */
  additionalMindmap?: boolean;
  /**
   * Stefan-2026-05-12 PA-0002 (R2a): when true, the 'collapse' slot is
   * appended to the slot list. Used ONLY by `group-expanded` variant
   * when `group.expansion_sticky: true` AND the card is currently inline-
   * expanded — gives the user a way to fold the topology back into the
   * compact tile (outside-click is suppressed under sticky expansion).
   * Ignored for all other variants — collapse on member/group-compact/
   * parallel-inline has no meaning. Replaces the 4-diamond's empty left
   * slot (180°) when neither effects nor mindmap is also there;
   * otherwise falls through to pentagon distribution.
   */
  hasCollapse?: boolean;
  /**
   * Stefan-2026-05-13 PA-0021 (R358): drop the 'mindmap' slot from the
   * `parallel-inline` variant. Set true when the picker is rendered for a
   * single-light context (no parallel-render branch active, no group to
   * expand) — Stefan-Quote PA-0021: "in this configs mode picker the
   * Mindmap icon is present but of course it has no effect. When the mode
   * picker would have no effect it should not be displayed!". The host
   * (everyday-light-card.ts) shares ONE PickerController across the
   * parallel-render branch AND the single-light fallback paths; this flag
   * lets the per-render call sites distinguish the two.
   */
  noParallelMindmap?: boolean;
}

/**
 * Resolve the slot-list for the given variant + options. The order of
 * the returned array determines the angle-assignment in
 * `getPickerAngleMap`: index 0 → top (270°), and subsequent slots
 * spread clockwise at 360°/n intervals. Stefan-2026-05-10 R202: parallel
 * is the prime "top" slot across all variants, saved/wheel/cycle fill
 * the cardinal positions, effects (when present) is added to make the
 * count 5 → pentagon distribution.
 */
export function getPickerSlots(
  variant: PickerVariant,
  opts: PickerLayoutOpts = {},
): PickerMode[] {
  if (variant === 'group-expanded' && opts.omitTemp) {
    return ['wheel', 'saved'];  // legacy 2-option
  }
  // Stefan-2026-05-10 P15.6-r46 (R221 + R222): parallel-inline picker
  // shows only saved + wheel (+ effects). Drops 'cycle' (every mode
  // already visible, nothing to cycle) and 'parallel' (already in
  // parallel mode, popup of same modes redundant).
  if (variant === 'parallel-inline') {
    // Stefan-2026-05-12 R338 (PA-0016): mindmap slot in parallel-inline
    // controls expand/contract of the parallel sliders themselves
    // (compact = 1 brightness slider; expanded = N axes side-by-side).
    // Always present in parallel-inline variant — gives users a way to
    // collapse the multi-axis view to a single slider on demand.
    // Stefan-2026-05-12 R330 (PA-0008) follow-on: mindmap is always at
    // the TOP of any picker that has it, so it occupies index 0.
    // Stefan-2026-05-13 PA-0021 (R358): drop mindmap when the host signals
    // `noParallelMindmap` — single-light renders use the same controller
    // but have no parallel-toggle target, so the icon would be a visual
    // no-op (Stefan-Quote: "when the mode picker would have no effect it
    // should not be displayed").
    const slots: PickerMode[] = opts.noParallelMindmap
      ? ['saved', 'wheel']
      : ['mindmap', 'saved', 'wheel'];
    if (opts.hasEffects) slots.push('effects');
    return slots;
  }
  // Modern layout (member + group-compact + group-expanded all share):
  // top (parallel) → upper-right (saved) → [lower-right (effects when
  // present)] → lower-bottom (wheel) → upper-left (cycle).
  // Stefan-2026-05-11 R238: when `useMindmap` is set, 'mindmap' replaces
  // 'parallel' in the top slot. Used for embedded nested-group cards.
  const topSlot: PickerMode = opts.useMindmap ? 'mindmap' : 'parallel';
  const slots: PickerMode[] = [topSlot, 'saved'];
  if (opts.hasEffects) slots.push('effects');
  slots.push('wheel');
  // Stefan-2026-05-12 P15.6-r63i (R309 / PA-0039): `cycle` slot dropped for
  // `group-expanded` variant. The parent in expanded layout has only an
  // icon — no slider to cycle — so the cycle action is a visual no-op that
  // confuses the picker. Stefan-Quote: "for this cards parent node it
  // doesnt make sense for it to have the mode picker element to cycle the
  // slider. because it is expanded and doesnt have a slider it can cycle".
  // member + group-compact still get cycle since they have a slider that
  // benefits from in-place mode switching.
  if (variant !== 'group-expanded') {
    slots.push('cycle');
  }
  // Stefan-2026-05-11 R290 (PA-14): mindmap as an additional slot when the
  // host opted in via `additionalMindmap`. Used by standalone-compact group
  // cards where the user wants BOTH parallel-popup AND mindmap-expand as
  // picker options. Adds 1 slot (5 or 6 total). Skipped when `useMindmap`
  // is already true (avoids double-mindmap).
  //
  // Stefan-2026-05-12 R330 (PA-0008): mindmap MUST always render at top
  // (angle 270°) when present. Stefan-Quote: "wenn im Press-drag-select
  // menü / dem mode picker die mindmap-option verfügbar ist, muss diese
  // immer oben angezeigt werden". Reorder so mindmap takes index 0 (top
  // anchor for `getPickerAngleMap`), and the displaced 'parallel' moves
  // to the end of the slot list. The other slots (saved/effects/wheel/
  // cycle) keep their relative order — angle distribution is the same
  // pentagon/hexagon shape, just rotated so mindmap occupies the north
  // pole. Skipped when `useMindmap` is already true (mindmap already at
  // top via `topSlot` resolution above).
  if (opts.additionalMindmap && !opts.useMindmap) {
    slots[0] = 'mindmap';
    slots.push('parallel');
  }
  // Stefan-2026-05-12 PA-0002 (R2a): append 'collapse' to group-expanded
  // when sticky-expansion is on. Other variants ignore this flag — the
  // 'collapse' action has no meaning outside the inline-expanded view.
  if (opts.hasCollapse && variant === 'group-expanded') {
    slots.push('collapse');
  }
  return slots;
}

/**
 * Angle assignment for each slot based on count. Distributes uniformly
 * around the circle starting from north (270°) and going clockwise.
 *
 *   n=2: [270, 90]               — top + bottom
 *   n=4: [270, 0, 90, 180]       — cardinals (top/right/bottom/left)
 *   n=5: [270, 342, 54, 126, 198] — pentagon
 *   n=6: [270, 330, 30, 90, 150, 210] — hexagon
 *
 * Special-case: omitTemp legacy — 2-option HORIZONTAL (wheel right,
 * saved left), so distribution is overridden to [0, 180].
 *
 * Stefan-2026-05-12 P15.6-r63i (R309 / PA-0039): group-expanded variant
 * keeps the 4-diamond cardinal positions even though the cycle slot is
 * dropped — the parallel/saved/wheel dots stay at top/right/bottom so the
 * user's muscle memory is preserved. The cycle's old 180° (left) just
 * becomes empty space. Otherwise a uniform 120° triangle would push
 * wheel to the lower-LEFT (150°), which violates the bottom=wheel
 * convention used everywhere else.
 */
export function getPickerAngleMap(
  variant: PickerVariant,
  opts: PickerLayoutOpts = {},
): Partial<Record<PickerMode, number>> {
  const slots = getPickerSlots(variant, opts);
  const result: Partial<Record<PickerMode, number>> = {};
  if (variant === 'group-expanded' && opts.omitTemp) {
    // Legacy horizontal layout — wheel right (0°), saved left (180°).
    result.wheel = 0;
    result.saved = 180;
    return result;
  }
  // Stefan-2026-05-12 P15.6-r63i (R309): group-expanded uses fixed
  // cardinal angles (not uniform-distribute) so dots stay at top/right/
  // bottom even when cycle is dropped. effects (when present) lands at
  // 180° (where cycle used to be) so 4 slots still form the diamond.
  // Stefan-2026-05-12 PA-0002 (R2a): collapse lands at 180° (the empty
  // left slot) when effects/mindmap aren't also there. When 5+ slots
  // are needed (e.g. sticky + hasEffects), fall through to pentagon.
  //
  // Stefan-2026-05-12 R341 (PA-0017): condition narrowed from `<= 4` to
  // `=== 4`. Stefan-Quote: "wenn der mode picker 3 icons hat dann sollen
  // diese immer so angeordnet sein wie die icons des mode pickers um
  // spot 1 in [config3.txt]" — that config produces parallel-inline with
  // 3 slots which fall through to uniform-distribute → equilateral
  // triangle [270, 30, 150]. group-expanded with 3 slots (parallel/
  // saved/wheel) was hitting the fixedAngles branch and rendering as
  // top/right/bottom L-shape. Now any 3-slot picker — regardless of
  // variant — uses the same uniform triangle distribution.
  if (variant === 'group-expanded' && slots.length === 4) {
    const fixedAngles: Partial<Record<PickerMode, number>> = {
      parallel: 270,
      saved: 0,
      wheel: 90,
      effects: 180,
      mindmap: 180,
      collapse: 180,
    };
    for (const slot of slots) {
      if (fixedAngles[slot] !== undefined) result[slot] = fixedAngles[slot];
    }
    return result;
  }
  const n = slots.length;
  const startAngle = 270;  // north (top)
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    const angle = (startAngle + i * step) % 360;
    result[slots[i]] = angle;
  }
  return result;
}

/**
 * Picker-dot viewport position for the given mode, based on icon-origin
 * and picker-variant. Used to anchor the wheel + saved-colors popups so
 * they bloom out from the picker-dot the user just chose (Stefan: "Mitte
 * vom color-wheel über dem color-wheel icon").
 *
 * Returns iconOrigin unchanged when the mode is not present in the
 * variant's angle-map (defensive: don't silently anchor at angle 0 and
 * fly the popup off-screen — surface the routing bug visibly instead).
 */
export function pickerDotPosition(
  mode: PickerMode,
  iconOrigin: { x: number; y: number },
  variant: PickerVariant = 'member',
  opts: PickerLayoutOpts = {},
): { x: number; y: number } {
  const angleMap = getPickerAngleMap(variant, opts);
  const angleDeg = angleMap[mode];
  if (angleDeg === undefined) return iconOrigin;
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: iconOrigin.x + Math.cos(a) * PICKER_ORBIT,
    y: iconOrigin.y + Math.sin(a) * PICKER_ORBIT,
  };
}

/**
 * Resolve the picker-hover for the given pointer offset from the icon
 * center. Returns the matching `PickerMode` or null when the pointer is
 * inside the dead-zone or outside the picker reach.
 *
 * Stefan-2026-05-10 P15.6-r38 (R203): now uses NEAREST-DOT detection
 * against the same angle-map the picker renders with. Old approach
 * was hardcoded angle bands per variant — broke when the picker added
 * 'cycle' / 'effects' slots that weren't in the bands. The new approach
 * scales to any number of slots automatically.
 */
export function pickerHoverFromPointer(
  dx: number,
  dy: number,
  variant: PickerVariant = 'member',
  opts: PickerLayoutOpts = {},
): PickerMode | null {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < DEAD_ZONE_R) return null;
  if (dist > PICKER_REACH_R) return null;
  let pointerAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (pointerAngle < 0) pointerAngle += 360;

  // Legacy horizontal 2-option (group-expanded + omitTemp): keep the
  // half-plane discriminator so dx>0 → wheel, dx<0 → saved. Avoids the
  // edge case where pointer-angle is exactly 90°/270° (vertical-ish
  // drag) and the nearest-dot tiebreak picks the wrong side.
  if (variant === 'group-expanded' && opts.omitTemp) {
    return dx > 0 ? 'wheel' : 'saved';
  }

  const angleMap = getPickerAngleMap(variant, opts);
  let bestMode: PickerMode | null = null;
  let bestDist = Infinity;
  for (const [mode, angle] of Object.entries(angleMap)) {
    let d = Math.abs(angle - pointerAngle);
    if (d > 180) d = 360 - d;
    if (d < bestDist) {
      bestDist = d;
      bestMode = mode as PickerMode;
    }
  }
  return bestMode;
}

/**
 * Backwards-compat alias kept so any external imports continue to work.
 * @deprecated 2026-05-10 P15.6-r38 — use `getPickerAngleMap()` which
 * accepts the `hasEffects` / `omitTemp` options.
 */
export const PICKER_ANGLES_BY_VARIANT: Record<
  PickerVariant,
  Partial<Record<PickerMode, number>>
> = {
  member: getPickerAngleMap('member'),
  'group-compact': getPickerAngleMap('group-compact'),
  'group-expanded': getPickerAngleMap('group-expanded'),
  'parallel-inline': getPickerAngleMap('parallel-inline'),
};
