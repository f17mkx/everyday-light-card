/**
 * R299 — Dynamic `--member-cols-gap` resolution (PA-0026 / PA-0031 / PA-0041).
 *
 * Stefan-Quote 2026-05-11 18:53 CEST (PA-0031):
 *   "wenn ich hier `http://192.168.2.231:8123/ed-slider/nested` zb spots
 *    aufklappe, dann sollen sich alle anderen gaps automatisch anpassen …
 *    aktuell sind alle abstände statisch … sie sollen aber relativ und
 *    dynamisch sein. du hast in r292 28/14/8 vorgeschlagen. Nimm diese
 *    werte doch als relationen. (und minimum abstand ist 3px oder so)"
 *
 * Pre-R299: depth-static absolutes (28/14/8/4 px) hardcoded in
 *   `group-layout-expanded.styles.ts` `:host([depth='N'])` rules and again
 *   in `group-layout-expanded.ts` `TILE_GRID_GAP` ternary. Cards at
 *   non-reference widths got too-wide or too-tight gaps.
 *
 * Post-R299: per-card pure-function computed gap. Each
 *   `<everyday-group-layout-expanded>` instance measures its own
 *   `.member-cols` container width, plugs it into this helper, applies the
 *   result as inline `--member-cols-gap` AND threads the same value into
 *   the mindmap-arm geometry (`tileGap`). ResizeObserver triggers
 *   recompute on container-width change; CSS fallback prevents FOUC on
 *   the first paint before measurement.
 *
 * Algorithm sketch (from the R299 sketch + Phase-A refinement in
 *   `.context/prompt-analysis-0041.md`):
 *
 *   ratios     = [3.5, 1.75, 1.0, 0.5, 0.25]   // depth 0 → 4, deeper clamps
 *   maxByDepth = [ 28,   14,    8,   4,    2]  // pre-R299 absolutes
 *   floor      = 3 px                          // Stefan-Spec "oder so"
 *   referenceWidth = 600 px                    // where the absolutes were tuned
 *   ratioToPxUnit  = 8 px / ratio-unit         // 3.5 × 8 = 28 ≈ depth-0 max
 *
 *   scale = containerWidth / referenceWidth
 *   raw   = ratios[depth] × ratioToPxUnit × scale
 *   gap   = clamp(effectiveFloor, maxByDepth[depth], raw)
 *
 *   effectiveFloor = min(floor, maxByDepth[depth])  // prevents
 *      contradiction at very deep depths where max < floor (depth ≥ 4).
 *
 * Why container-width scaling (not gap-budget redistribution): each card
 *   self-optimizes its own row. Cross-card coordination is unnecessary —
 *   the natural recursion (each embedded card runs the same algorithm
 *   against ITS OWN .member-cols width) gives sensible cascades without
 *   an event bus. The sketch's "boundary-depth-from-LCA" + global
 *   gap-space-distribution was elegant but over-engineered for the
 *   observed visual goal. Simplification reasoning in
 *   `.context/prompt-analysis-0041.md` Phase A.
 *
 * Why no `leafCount` / `leafSliderWidth` inputs: the existing CSS
 *   absolutes (28/14/8/4) ALREADY encode a depth-vs-leaf-count heuristic
 *   ("deeper = more cols = need tighter"). Container-width scaling on
 *   top is enough. If future-Stefan wants leaf-aware tuning, add it then.
 *
 * Side-effect-free, no Lit dependency, fully unit-testable.
 */

export const GAP_RATIOS = [3.5, 1.75, 1.0, 0.5, 0.25] as const;
export const GAP_MAX_BY_DEPTH = [28, 14, 8, 4, 2] as const;
export const GAP_FLOOR = 3;
export const GAP_REFERENCE_WIDTH = 600;
export const GAP_RATIO_TO_PX_UNIT = 8;

/**
 * Stefan-2026-05-12 R319-R322 (PA-0044): hard-floor for slider-width
 * override. Below this we accept overlap rather than render an unusable
 * touch-target. Stefan-Spec PA-14 R291: 40 px is the "comfortable
 * tappable minimum" for the bottom of the responsive-slider slope; 24 px
 * is below that but kept here as a defensive floor for the OVERRIDE path
 * — only kicks in when the natural cascade exceeds container capacity.
 */
export const SLIDER_WIDTH_HARD_FLOOR = 24;

export interface ComputeMemberColsGapOpts {
  /** Nesting depth of the card. 0 = outermost. Clamped to [0, ratios.length - 1]. */
  depth: number;
  /**
   * Measured `clientWidth` of the `.member-cols` element in px. Pass `0` /
   * `NaN` / `Infinity` to request the depth-static fallback (matches the
   * pre-R299 CSS rules, used for the initial paint before ResizeObserver
   * has measured).
   */
  containerWidth: number;
}

/**
 * Compute the dynamic `--member-cols-gap` value (px) for a single
 * group-layout-expanded card. Pure function — same inputs always yield
 * the same output.
 */
export function computeMemberColsGap(opts: ComputeMemberColsGapOpts): number {
  const depth = clampDepth(opts.depth);
  const maxGap = GAP_MAX_BY_DEPTH[depth];
  const effectiveFloor = Math.min(GAP_FLOOR, maxGap);
  if (!Number.isFinite(opts.containerWidth) || opts.containerWidth <= 0) {
    return maxGap;
  }
  const ratio = GAP_RATIOS[depth];
  const scale = opts.containerWidth / GAP_REFERENCE_WIDTH;
  const raw = ratio * GAP_RATIO_TO_PX_UNIT * scale;
  return Math.max(effectiveFloor, Math.min(maxGap, raw));
}

/** Internal: clamp the depth into the ratios array bounds. */
function clampDepth(depth: number): number {
  if (!Number.isFinite(depth)) return 0;
  const intDepth = Math.floor(depth);
  if (intDepth < 0) return 0;
  if (intDepth >= GAP_RATIOS.length) return GAP_RATIOS.length - 1;
  return intDepth;
}

export interface ResolveOverflowOpts {
  /** Depth of the card. Used for the gap-floor (effectiveFloor at deep levels). */
  depth: number;
  /** Measured `.member-cols.clientWidth` (px). */
  containerWidth: number;
  /** Number of direct children (cols). */
  childCount: number;
  /**
   * Baseline (inherited / cascaded) slider width (px). Read from the
   * host's computed `--everyday-slider-width` BEFORE any local override.
   * Determines whether this card's natural content exceeds its container.
   */
  baselineSliderWidth: number;
}

export interface ResolveOverflowResult {
  /** Final gap to apply (px). May be shrunk below `computeMemberColsGap`'s
   *  output if overflow forces it toward floor. */
  gap: number;
  /**
   * Local `--everyday-slider-width` override (px) to write inline on this
   * card's `.layout` element. `undefined` when no override is needed
   * (the cascade's baseline already fits). Descendants will inherit the
   * override; siblings under the same parent are unaffected.
   */
  sliderOverride?: number;
}

/**
 * R319-R322 (PA-0044): overflow-aware gap + slider-width resolution.
 *
 * Stefan-Spec PA-0044:
 *   - Priority: gaps shrink first, slider-width second.
 *   - The sliders must NEVER overlap (`scrollWidth ≤ clientWidth` after
 *     this returns, assuming `baselineSliderWidth` is the per-col content
 *     width).
 *   - Only the EXPANDED-subtree slider width is reduced. Compact cards
 *     never reach this code (they have no `.member-cols`).
 *   - 24 px hard-floor on slider width — below that, accept overlap (an
 *     unusable touch-target is worse than visual overlap).
 *
 * Algorithm:
 *   gap0 = computeMemberColsGap(depth, containerWidth)        // R299 base
 *   needed = childCount * baselineSliderWidth + (childCount-1) * gap0
 *   if needed ≤ containerWidth: return {gap: gap0}             // no overflow
 *   // Overflow → try gap-shrink first (Stefan priority "gaps first")
 *   gapForFit = (containerWidth - childCount * baselineSliderWidth) / (childCount-1)
 *   if gapForFit ≥ effectiveFloor:
 *     return {gap: gapForFit}                                   // gap alone fits it
 *   // Gap-shrink at floor still insufficient → override slider width
 *   return {gap: effectiveFloor, sliderOverride: (containerWidth - (childCount-1) * effectiveFloor) / childCount}
 *
 * The slider-override is clamped to `SLIDER_WIDTH_HARD_FLOOR` (24 px);
 * if even that doesn't fit, we still apply 24 px and accept that the
 * container is too narrow — bug-class downstream of an upstream config
 * problem (too many leaves, too tight a card width).
 *
 * Pure function — no Lit / DOM dependency. Re-derived each call so it
 * naturally relaxes the override when the container grows back.
 */
export function resolveOverflow(opts: ResolveOverflowOpts): ResolveOverflowResult {
  const depth = clampDepth(opts.depth);
  const maxGap = GAP_MAX_BY_DEPTH[depth];
  const effectiveFloor = Math.min(GAP_FLOOR, maxGap);
  const n = opts.childCount;
  const cw = opts.containerWidth;
  const baseline = opts.baselineSliderWidth;
  const baseGap = computeMemberColsGap({depth: opts.depth, containerWidth: cw});

  if (!Number.isFinite(cw) || cw <= 0 || n <= 1 || !Number.isFinite(baseline) || baseline <= 0) {
    return {gap: baseGap};
  }
  const needed = n * baseline + (n - 1) * baseGap;
  if (needed <= cw + 0.5) {
    return {gap: baseGap};
  }
  const slotCount = n - 1;
  const gapForFit = (cw - n * baseline) / slotCount;
  if (gapForFit >= effectiveFloor) {
    return {gap: gapForFit};
  }
  // Stefan-2026-05-12 R319-R322 follow-up: `Math.floor` the slider
  // override so CSS grid sub-pixel rounding (which discards fractional
  // col-widths) doesn't leave 1 px of content overflowing the col. With
  // 32.33 px override + 3 cols + 6 px gap = 103 px exactly, but grid
  // rounded each col to 32 px → 102 px used + 1 px stuck → each col's
  // 32.33 px slider content overflowed its 32 px col by 0.33 px = 1 px
  // reported scrollWidth. Flooring to 32 px gives 96 + 6 = 102 px content
  // in 103 px container, 1 px breathing room, zero scrollWidth overflow.
  const sliderRequired = Math.floor((cw - slotCount * effectiveFloor) / n);
  const sliderOverride = Math.max(SLIDER_WIDTH_HARD_FLOOR, sliderRequired);
  return {gap: effectiveFloor, sliderOverride};
}
