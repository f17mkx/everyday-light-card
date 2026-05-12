/**
 * Smoke tests for `helpers/popup-portal-styles.ts` — the shared CSS
 * block injected into document.head for body-portal popups.
 *
 * Stefan-2026-05-10 P16-extra: bump coverage to 100% by verifying the
 * exported constant is a non-empty string AND contains the key
 * selectors the host card and group-layout rely on. Pure smoke test —
 * no DOM, no rendering — just contract verification so accidental
 * deletion of a load-bearing rule fails CI.
 */
import { describe, it, expect } from 'vitest';
import { POPUP_PORTAL_STYLES } from '../src/helpers/popup-portal-styles.js';

describe('POPUP_PORTAL_STYLES', () => {
  it('exports a non-empty string', () => {
    expect(typeof POPUP_PORTAL_STYLES).toBe('string');
    expect(POPUP_PORTAL_STYLES.length).toBeGreaterThan(500);
  });

  it('contains the portal scope class', () => {
    expect(POPUP_PORTAL_STYLES).toContain('.everyday-popup-portal');
  });

  it('declares the in-place popup base class', () => {
    expect(POPUP_PORTAL_STYLES).toContain('.inplace-popup');
  });

  it('declares the wheel + saved variants', () => {
    expect(POPUP_PORTAL_STYLES).toContain('.inplace-popup.wheel');
    expect(POPUP_PORTAL_STYLES).toContain('.inplace-popup.saved');
  });

  it('declares the topology + parallel popup variants', () => {
    expect(POPUP_PORTAL_STYLES).toContain('.topology-popup');
    expect(POPUP_PORTAL_STYLES).toContain('.parallel-popup');
  });

  it('declares the bloom keyframes animation', () => {
    expect(POPUP_PORTAL_STYLES).toContain('everyday-inplace-bloom');
    expect(POPUP_PORTAL_STYLES).toContain('@keyframes');
  });

  it('uses the standard card-background-color CSS variable for theming', () => {
    expect(POPUP_PORTAL_STYLES).toContain('var(--card-background-color');
  });

  it('uses pointer-events: none on the portal scope (so non-popup areas pass through)', () => {
    expect(POPUP_PORTAL_STYLES).toMatch(/\.everyday-popup-portal\s*\{\s*pointer-events:\s*none/);
  });
});
