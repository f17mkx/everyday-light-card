/**
 * Tests for `helpers/member-cols-gap.ts` — R299 dynamic gap resolution.
 *
 * Stefan-2026-05-12 (PA-0041): pure-function tests against the algorithm
 * defined in the R299 sketch + Phase-A refinement. Cases mirror the
 * sketch's test-matrix plus the simplification-specific edges
 * (depth-clamp past array length, contradictory-floor-vs-max at deep
 * depths, invalid container widths, exact reference-width identity).
 *
 * Visual targets:
 *   - At reference width (600 px), depth N returns the original R292
 *     absolute (28/14/8/4/2 px). Drop-in compatibility for users on
 *     ~600-px-wide cards.
 *   - Narrower than reference → shrinks proportionally, floor 3 px.
 *   - Wider than reference → clamps at original absolute (no runaway gaps).
 */

import { describe, it, expect } from 'vitest';
import {
  computeMemberColsGap,
  resolveOverflow,
  GAP_RATIOS,
  GAP_MAX_BY_DEPTH,
  GAP_FLOOR,
  GAP_REFERENCE_WIDTH,
  SLIDER_WIDTH_HARD_FLOOR,
} from '../src/helpers/member-cols-gap.js';

describe('R299 constants', () => {
  it('ratios array length matches max-array length', () => {
    expect(GAP_RATIOS.length).toBe(GAP_MAX_BY_DEPTH.length);
  });

  it('ratios are monotonically non-increasing (deeper never wider)', () => {
    // Stefan-2026-05-12 R337 (PA-0016): depth-0 == depth-1, so the
    // monotonicity is non-strict. Adjacent equal ratios are now valid —
    // an inter-group boundary at any nesting depth gets the same gap.
    for (let i = 1; i < GAP_RATIOS.length; i++) {
      expect(GAP_RATIOS[i]).toBeLessThanOrEqual(GAP_RATIOS[i - 1]);
    }
  });

  it('floor is positive', () => {
    expect(GAP_FLOOR).toBeGreaterThan(0);
  });
});

describe('computeMemberColsGap — reference width (R337 equalised depth-0/1)', () => {
  // Stefan-2026-05-12 R337 (PA-0016): depth-0 == depth-1 = 14 px (any
  // inter-group boundary). Depth-2 = 7 px (within Hall/Bathroom). Depth 3+
  // hits the floor at 3 px (within Spots).
  it('depth 0 at 600 px = 14 px (R337: equal to depth-1, any inter-group)', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: GAP_REFERENCE_WIDTH })).toBe(14);
  });

  it('depth 1 at 600 px = 14 px (R337: equal to depth-0)', () => {
    expect(computeMemberColsGap({ depth: 1, containerWidth: GAP_REFERENCE_WIDTH })).toBe(14);
  });

  it('depth 2 at 600 px = 7 px (R337: half of depth-0/1)', () => {
    expect(computeMemberColsGap({ depth: 2, containerWidth: GAP_REFERENCE_WIDTH })).toBe(7);
  });

  it('depth 3 at 600 px = 3 px (floor, intra-deepest-group)', () => {
    expect(computeMemberColsGap({ depth: 3, containerWidth: GAP_REFERENCE_WIDTH })).toBe(3);
  });
});

describe('computeMemberColsGap — narrow container (shrinks proportionally)', () => {
  it('depth 0 at 300 px scales to 7 px (half of 14)', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: 300 })).toBeCloseTo(7, 5);
  });

  it('depth 0 at 150 px clamps at floor 3 (would be 3.5)', () => {
    // 1.75 * 8 * (150/600) = 3.5 → clamp(min(3,28)=3, 28, 3.5) = 3.5
    expect(computeMemberColsGap({ depth: 0, containerWidth: 150 })).toBeCloseTo(3.5, 5);
  });

  it('depth 1 at 300 px scales to 7 px (same as depth-0 by R337)', () => {
    expect(computeMemberColsGap({ depth: 1, containerWidth: 300 })).toBeCloseTo(7, 5);
  });

  it('depth 2 at 300 px clamps at floor 3 px (would be 3.5 — but 0.875*8*(300/600)=3.5, ≥ floor 3)', () => {
    // 0.875 * 8 * 0.5 = 3.5 → above floor, no clamp.
    expect(computeMemberColsGap({ depth: 2, containerWidth: 300 })).toBeCloseTo(3.5, 5);
  });

  it('depth 3 at 300 px clamps at floor 3 px (would be 1.5)', () => {
    expect(computeMemberColsGap({ depth: 3, containerWidth: 300 })).toBe(GAP_FLOOR);
  });
});

describe('computeMemberColsGap — wide container (R337 caps 28/28/14/8/6)', () => {
  // Stefan-2026-05-12 R337 (PA-0016): caps lifted to 2× base. Algorithm is
  // proportional in typical HA card range (300-800 px); cap kicks in
  // around 1200 px (= 2× reference-width).
  it('depth 0 at 1200 px = 28 px (proportional, hits new cap)', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: 1200 })).toBe(28);
  });

  it('depth 0 at 800 px scales to 18.67 px (proportional, no cap)', () => {
    // 1.75 * 8 * (800/600) = 18.667
    expect(computeMemberColsGap({ depth: 0, containerWidth: 800 })).toBeCloseTo(18.67, 1);
  });

  it('depth 1 at 1200 px = 28 px (proportional, hits new cap, same as depth-0)', () => {
    expect(computeMemberColsGap({ depth: 1, containerWidth: 1200 })).toBe(28);
  });

  it('depth 2 at 9999 px clamps at 14 px (max)', () => {
    expect(computeMemberColsGap({ depth: 2, containerWidth: 9999 })).toBe(14);
  });
});

describe('computeMemberColsGap — floor (very narrow / very deep)', () => {
  it('depth 0 at 50 px clamps to floor (would be 2.33)', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: 50 })).toBe(GAP_FLOOR);
  });

  it('depth 2 at 100 px clamps to floor (would be 1.33)', () => {
    expect(computeMemberColsGap({ depth: 2, containerWidth: 100 })).toBe(GAP_FLOOR);
  });

  it('depth 3 at 150 px clamps to floor (would be 1)', () => {
    expect(computeMemberColsGap({ depth: 3, containerWidth: 150 })).toBe(GAP_FLOOR);
  });

  it('depth 4 at reference floors at 3 (R337 max 6 > floor 3 → floor wins for tiny raw)', () => {
    // R337: max[4]=6 ≥ floor 3 → effectiveFloor = min(3, 6) = 3. Raw at
    // reference: 0.25 * 8 = 2 → clamp(3, 6, 2) = 3.
    expect(computeMemberColsGap({ depth: 4, containerWidth: GAP_REFERENCE_WIDTH })).toBe(3);
  });

  it('depth 4 at very narrow also floors at 3', () => {
    expect(computeMemberColsGap({ depth: 4, containerWidth: 50 })).toBe(3);
  });
});

describe('computeMemberColsGap — depth-out-of-range (clamp to array bounds)', () => {
  it('depth 5 clamps to depth 4 behavior', () => {
    const d5 = computeMemberColsGap({ depth: 5, containerWidth: GAP_REFERENCE_WIDTH });
    const d4 = computeMemberColsGap({ depth: 4, containerWidth: GAP_REFERENCE_WIDTH });
    expect(d5).toBe(d4);
  });

  it('depth 99 clamps to depth 4 behavior', () => {
    const d99 = computeMemberColsGap({ depth: 99, containerWidth: GAP_REFERENCE_WIDTH });
    const d4 = computeMemberColsGap({ depth: 4, containerWidth: GAP_REFERENCE_WIDTH });
    expect(d99).toBe(d4);
  });

  it('negative depth clamps to depth 0 behavior', () => {
    const dNeg = computeMemberColsGap({ depth: -1, containerWidth: GAP_REFERENCE_WIDTH });
    const d0 = computeMemberColsGap({ depth: 0, containerWidth: GAP_REFERENCE_WIDTH });
    expect(dNeg).toBe(d0);
  });

  it('fractional depth floors (1.7 → 1)', () => {
    const dFrac = computeMemberColsGap({ depth: 1.7, containerWidth: GAP_REFERENCE_WIDTH });
    const dInt = computeMemberColsGap({ depth: 1, containerWidth: GAP_REFERENCE_WIDTH });
    expect(dFrac).toBe(dInt);
  });
});

describe('computeMemberColsGap — invalid container width (depth-static fallback)', () => {
  // Pre-measurement / pre-mount fallback. Should match the depth max so
  // the inline-style + CSS-fallback agree before the first measurement.

  it('width 0 returns depth max (= CSS fallback)', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: 0 })).toBe(GAP_MAX_BY_DEPTH[0]);
    expect(computeMemberColsGap({ depth: 2, containerWidth: 0 })).toBe(GAP_MAX_BY_DEPTH[2]);
  });

  it('width NaN returns depth max', () => {
    expect(computeMemberColsGap({ depth: 0, containerWidth: NaN })).toBe(GAP_MAX_BY_DEPTH[0]);
  });

  it('width Infinity returns depth max', () => {
    expect(computeMemberColsGap({ depth: 1, containerWidth: Infinity })).toBe(GAP_MAX_BY_DEPTH[1]);
  });

  it('negative width returns depth max', () => {
    expect(computeMemberColsGap({ depth: 2, containerWidth: -50 })).toBe(GAP_MAX_BY_DEPTH[2]);
  });
});

describe('computeMemberColsGap — ratio preservation (mid-range values)', () => {
  // Verify the SCALING is proportional. At any single non-clamped width,
  // depth-d1 / depth-d2 = ratios[d1] / ratios[d2].

  it('ratio depth-0 vs depth-1 at any width = 1 (R337: depth-0 == depth-1)', () => {
    // Stefan-2026-05-12 R337 (PA-0016): depth-0 and depth-1 are equal at
    // every width (both are "any inter-group boundary"). Ratio = 1.
    const d0 = computeMemberColsGap({ depth: 0, containerWidth: 300 });
    const d1 = computeMemberColsGap({ depth: 1, containerWidth: 300 });
    expect(d0).toBe(d1);
    expect(GAP_RATIOS[0]).toBe(GAP_RATIOS[1]);
  });

  it('ratio depth-1 vs depth-2 at reference width = ratios[1] / ratios[2]', () => {
    // R337: d1 = 14, d2 = 7 → ratio 2 = 1.75 / 0.875. Reference width 600
    // avoids floor-clamp at depth-2.
    const d1 = computeMemberColsGap({ depth: 1, containerWidth: GAP_REFERENCE_WIDTH });
    const d2 = computeMemberColsGap({ depth: 2, containerWidth: GAP_REFERENCE_WIDTH });
    expect(d1 / d2).toBeCloseTo(GAP_RATIOS[1] / GAP_RATIOS[2], 5);
  });
});

describe('computeMemberColsGap — monotonicity (wider always means ≥ narrower at same depth)', () => {
  it('depth 0 gap is monotonically non-decreasing in containerWidth', () => {
    const widths = [50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500];
    let prev = -1;
    for (const w of widths) {
      const g = computeMemberColsGap({ depth: 0, containerWidth: w });
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });

  it('depth 2 gap is monotonically non-decreasing in containerWidth', () => {
    const widths = [50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500];
    let prev = -1;
    for (const w of widths) {
      const g = computeMemberColsGap({ depth: 2, containerWidth: w });
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });
});

describe('resolveOverflow (R319-R322) — no overflow case (gap from R299, no override)', () => {
  it('returns base gap when content fits comfortably', () => {
    // depth 2, container 400 px, 3 children @ 40 px slider, baseGap = 5.33
    // needed = 3*40 + 2*5.33 = 130.67 ≤ 400 → no override
    const r = resolveOverflow({
      depth: 2,
      containerWidth: 400,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    expect(r.sliderOverride).toBeUndefined();
    expect(r.gap).toBeCloseTo(computeMemberColsGap({depth: 2, containerWidth: 400}), 5);
  });

  it('returns base gap on a generous container (depth 0, 1200 px, 2 children)', () => {
    const r = resolveOverflow({
      depth: 0,
      containerWidth: 1200,
      childCount: 2,
      baselineSliderWidth: 40,
    });
    expect(r.sliderOverride).toBeUndefined();
    // Stefan-2026-05-12 R337 (PA-0016): max cap at depth 0 = 28 (= 2×
    // base ratio 1.75 × 8). At 1200 px (= 2× reference), gap reaches cap.
    expect(r.gap).toBe(28);
  });

  it('handles n=1 (no slot, never overflows via gaps)', () => {
    // One col: never has a gap-slot, always fits.
    const r = resolveOverflow({
      depth: 2,
      containerWidth: 30,    // even if slider doesn't fit
      childCount: 1,
      baselineSliderWidth: 40,
    });
    expect(r.sliderOverride).toBeUndefined();
  });
});

describe('resolveOverflow (R319-R322) — gap-shrink-first absorbs overflow (no slider override)', () => {
  it('depth 2, container 130 px, 3 sliders @ 40: gap shrinks from 8 to fit', () => {
    // base gap = computeMemberColsGap(2, 130) = 1.73, but floor at 3.
    // Actually since 130 < ref-width, base gap is 130/600*8 = 1.73 → floor 3.
    // needed = 3*40 + 2*3 = 126 ≤ 130 → no overflow, returns base.
    const r = resolveOverflow({
      depth: 2,
      containerWidth: 130,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    expect(r.sliderOverride).toBeUndefined();
  });

  it('depth 0, container 200 px, 3 sliders @ 40: gap-shrink from 28 to ~40 px space available', () => {
    // base gap depth 0 at 200 px = 200/600 * 28 = 9.33
    // needed = 3*40 + 2*9.33 = 138.67 ≤ 200 → no overflow → base gap.
    const r = resolveOverflow({
      depth: 0,
      containerWidth: 200,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    expect(r.sliderOverride).toBeUndefined();
  });

  it('forces gap shrink to non-floor when overflow exists but gap-fit ≥ floor', () => {
    // Stefan-2026-05-12 R337 (PA-0016): post-R337 gaps are smaller at
    // narrow widths, so the "overflow but gap-shrink fits" scenario needs
    // bigger sliders + wider containers. Construct: depth-1 at 345 px,
    // baseline 110 → base gap 8.05, needed = 330 + 16.1 = 346.1 > 345 →
    // overflow. gapForFit = (345 - 330)/2 = 7.5 ≥ floor 3 → gap shrinks
    // to 7.5 with no slider override.
    const r = resolveOverflow({
      depth: 1,
      containerWidth: 345,
      childCount: 3,
      baselineSliderWidth: 110,
    });
    expect(r.sliderOverride).toBeUndefined();
    expect(r.gap).toBeCloseTo(7.5, 2);
  });
});

describe('resolveOverflow (R319-R322) — gap-at-floor + slider-override (Spots case)', () => {
  it('Spots live case: depth 3, container 103 px, 3 sliders @ 40 → slider override 32 (floored)', () => {
    // Floor at depth 3 = min(GAP_FLOOR=3, max[3]=4) = 3
    // needed (with R299 base gap clamped at floor): 3*40 + 2*3 = 126 > 103
    // gapForFit = (103 - 120) / 2 = -8.5 < floor(3) → fallback to slider override
    // sliderOverride = floor((103 - 2*3) / 3) = floor(32.33) = 32
    // post-fix: 3*32 + 2*3 = 102 ≤ 103 → 1 px breathing room, no overlap.
    const r = resolveOverflow({
      depth: 3,
      containerWidth: 103,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    expect(r.gap).toBe(GAP_FLOOR);
    expect(r.sliderOverride).toBe(32);
  });

  it('very narrow container hits 24 px hard-floor (accepts overflow)', () => {
    // depth 3, container 50 px, 3 sliders → required = (50-6)/3 = 14.67 < 24 → clamp 24.
    // 3*24 + 2*3 = 78 > 50 → overlap accepted (unfit but slider stays usable).
    const r = resolveOverflow({
      depth: 3,
      containerWidth: 50,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    expect(r.gap).toBe(GAP_FLOOR);
    expect(r.sliderOverride).toBe(SLIDER_WIDTH_HARD_FLOOR);
  });

  it('post-fix: total content (floored slider + floor gap) fits with at most 1 px slack', () => {
    // Live Spots case: cw=103, baseline=40, n=3 → slider 32 + gap 3 → total 102.
    const r = resolveOverflow({
      depth: 3,
      containerWidth: 103,
      childCount: 3,
      baselineSliderWidth: 40,
    });
    const total = 3 * (r.sliderOverride ?? 40) + 2 * r.gap;
    expect(total).toBeLessThanOrEqual(103);
    expect(total).toBeGreaterThanOrEqual(101);
  });
});

describe('resolveOverflow (R319-R322) — invariants', () => {
  it('post-fit: total content width ≤ containerWidth for non-pathological inputs', () => {
    const cases = [
      {depth: 2, cw: 200, n: 3, baseline: 40},
      {depth: 2, cw: 130, n: 3, baseline: 40},
      {depth: 3, cw: 103, n: 3, baseline: 40},
      {depth: 3, cw: 90, n: 3, baseline: 40},
      {depth: 0, cw: 600, n: 2, baseline: 60},
      {depth: 1, cw: 300, n: 4, baseline: 50},
    ];
    for (const c of cases) {
      const r = resolveOverflow({
        depth: c.depth, containerWidth: c.cw,
        childCount: c.n, baselineSliderWidth: c.baseline,
      });
      const slider = r.sliderOverride ?? c.baseline;
      // For non-pathological (baseline-fits case OR gap-shrunk OR slider-shrunk-above-hard-floor):
      // total content width must not exceed container.
      const totalContent = c.n * slider + (c.n - 1) * r.gap;
      // Allow tiny tolerance for floating-point.
      if (slider > SLIDER_WIDTH_HARD_FLOOR + 0.01) {
        // Non-pathological: must fit.
        expect(totalContent).toBeLessThanOrEqual(c.cw + 0.5);
      }
    }
  });

  it('relaxes back to no-override when container grows', () => {
    // Same card, narrow → override; widen → no override. Self-stabilizing.
    const narrow = resolveOverflow({
      depth: 3, containerWidth: 103, childCount: 3, baselineSliderWidth: 40,
    });
    const wide = resolveOverflow({
      depth: 3, containerWidth: 300, childCount: 3, baselineSliderWidth: 40,
    });
    expect(narrow.sliderOverride).toBeDefined();
    expect(wide.sliderOverride).toBeUndefined();
  });

  it('handles invalid baseline (NaN, 0, negative) without throwing', () => {
    expect(() => resolveOverflow({
      depth: 2, containerWidth: 100, childCount: 3, baselineSliderWidth: NaN,
    })).not.toThrow();
    expect(() => resolveOverflow({
      depth: 2, containerWidth: 100, childCount: 3, baselineSliderWidth: 0,
    })).not.toThrow();
    expect(() => resolveOverflow({
      depth: 2, containerWidth: 100, childCount: 3, baselineSliderWidth: -10,
    })).not.toThrow();
  });
});
