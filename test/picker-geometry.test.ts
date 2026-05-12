/**
 * Tests for `helpers/picker-geometry.ts` — pure-math helpers used by the
 * mode-picker hit-test + popup-anchor calculation.
 *
 * Stefan-2026-05-10 P15.6-r38: refactored from per-variant fixed-angle
 * bands to dynamic-count circular distribution. Tests cover both the
 * 4-diamond default (parallel/saved/wheel/cycle) and the 5-pentagon
 * `hasEffects` layout, plus the legacy `omitTemp` 2-option mode for
 * back-compat with pre-r38 group-expanded callers.
 */
import { describe, it, expect } from 'vitest';
import {
  PICKER_ORBIT,
  PICKER_ANGLES_BY_VARIANT,
  pickerDotPosition,
  pickerHoverFromPointer,
  getPickerSlots,
  getPickerAngleMap,
} from '../src/helpers/picker-geometry.js';

describe('PICKER_ORBIT', () => {
  it('exports the orbit-radius constant', () => {
    expect(PICKER_ORBIT).toBe(64);
  });
});

describe('getPickerSlots', () => {
  it('returns 4-diamond default for member variant', () => {
    expect(getPickerSlots('member')).toEqual(['parallel', 'saved', 'wheel', 'cycle']);
  });

  it('returns 5-pentagon when hasEffects', () => {
    expect(getPickerSlots('member', { hasEffects: true })).toEqual([
      'parallel',
      'saved',
      'effects',
      'wheel',
      'cycle',
    ]);
  });

  it('group-compact has same slots as member (post-r38 unification)', () => {
    expect(getPickerSlots('group-compact')).toEqual(['parallel', 'saved', 'wheel', 'cycle']);
  });

  // Stefan-2026-05-12 P15.6-r63i (R309 / PA-0039): group-expanded drops
  // 'cycle' — parent in expanded layout has no slider to cycle (Stefan-Quote:
  // "doesnt have a slider it can cycle"). Result: 3-slot triangle.
  it('group-expanded drops cycle (no slider to cycle in expanded parent)', () => {
    expect(getPickerSlots('group-expanded')).toEqual(['parallel', 'saved', 'wheel']);
  });

  it('group-expanded + hasEffects → 4-slot (parallel/saved/effects/wheel, still no cycle)', () => {
    expect(getPickerSlots('group-expanded', { hasEffects: true })).toEqual([
      'parallel',
      'saved',
      'effects',
      'wheel',
    ]);
  });

  it('omitTemp legacy → 2-option (wheel + saved only)', () => {
    expect(getPickerSlots('group-expanded', { omitTemp: true })).toEqual(['wheel', 'saved']);
  });

  // Stefan-2026-05-10 P15.6-r46 (R221 + R222): parallel-inline variant.
  it('parallel-inline → saved + wheel only (drops cycle + parallel)', () => {
    expect(getPickerSlots('parallel-inline')).toEqual(['saved', 'wheel']);
  });

  it('parallel-inline + hasEffects → saved + wheel + effects', () => {
    expect(getPickerSlots('parallel-inline', { hasEffects: true })).toEqual([
      'saved',
      'wheel',
      'effects',
    ]);
  });
});

describe('getPickerAngleMap', () => {
  it('4-diamond cardinals: 270 / 0 / 90 / 180', () => {
    const m = getPickerAngleMap('member');
    expect(m.parallel).toBe(270);
    expect(m.saved).toBe(0);
    expect(m.wheel).toBe(90);
    expect(m.cycle).toBe(180);
  });

  it('pentagon angles: 270 / 342 / 54 / 126 / 198', () => {
    const m = getPickerAngleMap('member', { hasEffects: true });
    expect(m.parallel).toBe(270);
    expect(m.saved).toBe(342);
    expect(m.effects).toBe(54);
    expect(m.wheel).toBe(126);
    expect(m.cycle).toBe(198);
  });

  it('omitTemp legacy: wheel right (0°) + saved left (180°)', () => {
    const m = getPickerAngleMap('group-expanded', { omitTemp: true });
    expect(m.wheel).toBe(0);
    expect(m.saved).toBe(180);
    expect(m.cycle).toBeUndefined();
    expect(m.parallel).toBeUndefined();
  });
});

describe('PICKER_ANGLES_BY_VARIANT (back-compat)', () => {
  it('exports the post-r38 default 4-diamond angles', () => {
    expect(PICKER_ANGLES_BY_VARIANT.member.parallel).toBe(270);
    expect(PICKER_ANGLES_BY_VARIANT.member.wheel).toBe(90);
  });
});

describe('pickerDotPosition', () => {
  const origin = { x: 100, y: 200 };

  it('returns origin unchanged when mode is missing from variant map', () => {
    // 'mindmap' isn't in member-variant default — should return origin verbatim.
    expect(pickerDotPosition('mindmap', origin, 'member')).toEqual(origin);
  });

  it('places member-wheel directly below origin (90°)', () => {
    const pos = pickerDotPosition('wheel', origin, 'member');
    // 90° = down in screen coords. cos(90°) = ~0, sin(90°) = 1.
    expect(pos.x).toBeCloseTo(100, 5);
    expect(pos.y).toBeCloseTo(264, 5);  // 200 + 64
  });

  it('places member-saved directly right (0°)', () => {
    const pos = pickerDotPosition('saved', origin, 'member');
    expect(pos.x).toBeCloseTo(164, 5);  // 100 + 64
    expect(pos.y).toBeCloseTo(200, 5);
  });

  it('places member-cycle directly left (180°)', () => {
    const pos = pickerDotPosition('cycle', origin, 'member');
    expect(pos.x).toBeCloseTo(36, 5);   // 100 - 64
    expect(pos.y).toBeCloseTo(200, 5);
  });

  it('omitTemp wheel sits to the right (0°)', () => {
    const pos = pickerDotPosition('wheel', origin, 'group-expanded', { omitTemp: true });
    expect(pos.x).toBeCloseTo(164, 5);
    expect(pos.y).toBeCloseTo(200, 5);
  });
});

describe('pickerHoverFromPointer (member variant, 4-diamond default)', () => {
  it('returns null inside the dead-zone (< 18 px from icon)', () => {
    expect(pickerHoverFromPointer(5, 5, 'member')).toBeNull();
  });

  it('returns null outside the picker reach (> 160 px)', () => {
    expect(pickerHoverFromPointer(200, 0, 'member')).toBeNull();
  });

  it('detects "wheel" when dragging straight down (90°)', () => {
    expect(pickerHoverFromPointer(0, 80, 'member')).toBe('wheel');
  });

  it('detects "cycle" when dragging straight left (180°)', () => {
    expect(pickerHoverFromPointer(-80, 0, 'member')).toBe('cycle');
  });

  it('detects "parallel" when dragging straight up (270°)', () => {
    expect(pickerHoverFromPointer(0, -80, 'member')).toBe('parallel');
  });

  it('detects "saved" when dragging straight right (0°)', () => {
    expect(pickerHoverFromPointer(80, 0, 'member')).toBe('saved');
  });
});

describe('pickerHoverFromPointer (member + hasEffects pentagon)', () => {
  it('detects "parallel" at top (270°)', () => {
    expect(pickerHoverFromPointer(0, -80, 'member', { hasEffects: true })).toBe('parallel');
  });

  it('detects "saved" near upper-right (~342°)', () => {
    // angle = atan2(-25, 76) ≈ -18° → 342°
    expect(pickerHoverFromPointer(76, -25, 'member', { hasEffects: true })).toBe('saved');
  });

  it('detects "effects" near lower-right (~54°)', () => {
    // angle = atan2(65, 47) ≈ 54°
    expect(pickerHoverFromPointer(47, 65, 'member', { hasEffects: true })).toBe('effects');
  });

  it('detects "wheel" near lower-left (~126°)', () => {
    // angle = atan2(65, -47) ≈ 126°
    expect(pickerHoverFromPointer(-47, 65, 'member', { hasEffects: true })).toBe('wheel');
  });

  it('detects "cycle" near upper-left (~198°)', () => {
    // angle = atan2(-25, -76) ≈ 198°
    expect(pickerHoverFromPointer(-76, -25, 'member', { hasEffects: true })).toBe('cycle');
  });
});

describe('pickerHoverFromPointer (group-compact + group-expanded share modern layout)', () => {
  it('group-compact: same as member (parallel up, saved right, wheel down, cycle left)', () => {
    expect(pickerHoverFromPointer(0, -80, 'group-compact')).toBe('parallel');
    expect(pickerHoverFromPointer(80, 0, 'group-compact')).toBe('saved');
    expect(pickerHoverFromPointer(0, 80, 'group-compact')).toBe('wheel');
    expect(pickerHoverFromPointer(-80, 0, 'group-compact')).toBe('cycle');
  });

  it('group-expanded (modern, no omitTemp): same 4-diamond as member', () => {
    expect(pickerHoverFromPointer(0, -80, 'group-expanded')).toBe('parallel');
    expect(pickerHoverFromPointer(0, 80, 'group-expanded')).toBe('wheel');
  });
});

describe('pickerHoverFromPointer (group-expanded + omitTemp legacy 2-option)', () => {
  it('uses simple half-plane: dx > 0 → wheel', () => {
    expect(pickerHoverFromPointer(80, 0, 'group-expanded', { omitTemp: true })).toBe('wheel');
    expect(pickerHoverFromPointer(80, 50, 'group-expanded', { omitTemp: true })).toBe('wheel');
    expect(pickerHoverFromPointer(80, -50, 'group-expanded', { omitTemp: true })).toBe('wheel');
  });

  it('uses simple half-plane: dx < 0 → saved', () => {
    expect(pickerHoverFromPointer(-80, 0, 'group-expanded', { omitTemp: true })).toBe('saved');
    expect(pickerHoverFromPointer(-80, 50, 'group-expanded', { omitTemp: true })).toBe('saved');
    expect(pickerHoverFromPointer(-80, -50, 'group-expanded', { omitTemp: true })).toBe('saved');
  });

  it('still respects dead-zone for omitTemp', () => {
    expect(pickerHoverFromPointer(5, 0, 'group-expanded', { omitTemp: true })).toBeNull();
  });
});
