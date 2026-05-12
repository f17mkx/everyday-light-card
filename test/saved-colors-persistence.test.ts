/**
 * Tests for `helpers/saved-colors-persistence.ts` — the read/write/diff
 * trio for the saved-colors palette source-of-truth flow (P7.1).
 *
 * Stefan-2026-05-10 P16-extra: covers
 *   - readSavedColorsFromSource: static / helper / missing / invalid-JSON / >2 nesting
 *   - persistSavedColorsToSource: helper write / overflow signal / no-op for static
 *   - savedColorsDiffer: length mismatch + per-tuple-channel mismatch
 */
import { describe, it, expect, vi } from 'vitest';
import {
  readSavedColorsFromSource,
  persistSavedColorsToSource,
  savedColorsDiffer,
} from '../src/helpers/saved-colors-persistence.js';

type HassShim = {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
  callService: ReturnType<typeof vi.fn>;
};

const stubHass = (states: HassShim['states']): HassShim => ({
  states,
  callService: vi.fn(async () => undefined),
});

const RED: [number, number, number] = [255, 0, 0];
const GREEN: [number, number, number] = [0, 255, 0];
const BLUE: [number, number, number] = [0, 0, 255];

describe('readSavedColorsFromSource', () => {
  it('returns null when cfg is missing or has no source', () => {
    expect(readSavedColorsFromSource(undefined, undefined, [])).toBeNull();
    expect(readSavedColorsFromSource(undefined, { source: undefined as never }, [])).toBeNull();
  });

  it('reads static source when current is empty', () => {
    const result = readSavedColorsFromSource(undefined, {
      source: 'static',
      static: [RED, GREEN],
    }, []);
    expect(result).toEqual([RED, GREEN]);
  });

  it('returns null when static source matches current (no diff)', () => {
    const result = readSavedColorsFromSource(undefined, {
      source: 'static',
      static: [RED, GREEN],
    }, [RED, GREEN]);
    expect(result).toBeNull();
  });

  it('reads valid JSON from helper', () => {
    const hass = stubHass({
      'input_text.palette': {
        state: JSON.stringify([RED, BLUE]),
        attributes: {},
      },
    });
    const result = readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    );
    expect(result).toEqual([RED, BLUE]);
  });

  it('returns null when helper state is unavailable / unknown', () => {
    const hass = stubHass({
      'input_text.palette': { state: 'unavailable', attributes: {} },
    });
    expect(readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [RED],
    )).toBeNull();
  });

  it('silently ignores invalid JSON in helper', () => {
    const hass = stubHass({
      'input_text.palette': { state: 'not json', attributes: {} },
    });
    expect(readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    )).toBeNull();
  });

  it('filters out malformed tuples (wrong length, non-number, out-of-range)', () => {
    const hass = stubHass({
      'input_text.palette': {
        state: JSON.stringify([
          [255, 0, 0],          // valid
          [0, 256, 0],          // out of range — drop
          [0, 0],                // wrong length — drop
          ['a', 'b', 'c'],       // non-number — drop
          [0, 0, 255],           // valid
        ]),
        attributes: {},
      },
    });
    const result = readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    );
    expect(result).toEqual([RED, BLUE]);
  });

  it('returns null for ha_favorites source (research pending)', () => {
    expect(readSavedColorsFromSource(undefined, {
      source: 'ha_favorites' as never,
    }, [])).toBeNull();
  });
});

describe('persistSavedColorsToSource', () => {
  it('returns null when source is static (no-op)', () => {
    expect(persistSavedColorsToSource(undefined, { source: 'static' }, [RED])).toBeNull();
  });

  it('returns null when cfg is missing entirely', () => {
    expect(persistSavedColorsToSource(undefined, undefined, [RED])).toBeNull();
  });

  it('calls input_text.set_value when helper has space', async () => {
    const hass = stubHass({
      'input_text.palette': { state: '[]', attributes: { max: 1000 } },
    });
    const result = persistSavedColorsToSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [RED, GREEN],
    );
    expect(result).toEqual({ ok: true });
    expect(hass.callService).toHaveBeenCalledWith('input_text', 'set_value', {
      entity_id: 'input_text.palette',
      value: JSON.stringify([RED, GREEN]),
    });
  });

  it('signals overflow when JSON exceeds helper max', () => {
    const hass = stubHass({
      'input_text.palette': { state: '[]', attributes: { max: 5 } },
    });
    const result = persistSavedColorsToSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [RED, GREEN, BLUE],
    );
    expect(result).toEqual({
      overflow: {
        helperId: 'input_text.palette',
        length: JSON.stringify([RED, GREEN, BLUE]).length,
        max: 5,
      },
    });
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('uses default max=100 when helper has no max attribute', () => {
    const longPalette = Array(20).fill(RED);
    const hass = stubHass({
      'input_text.palette': { state: '[]', attributes: {} },
    });
    const result = persistSavedColorsToSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      longPalette,
    );
    expect(result).toMatchObject({ overflow: { max: 100 } });
  });
});

describe('savedColorsDiffer', () => {
  it('detects length mismatch', () => {
    expect(savedColorsDiffer([RED], [RED, GREEN])).toBe(true);
    expect(savedColorsDiffer([], [RED])).toBe(true);
  });

  it('detects per-channel difference within same-length arrays', () => {
    expect(savedColorsDiffer([RED], [GREEN])).toBe(true);
    expect(savedColorsDiffer([[100, 100, 100]], [[100, 100, 99]])).toBe(true);
  });

  it('returns false for structurally identical arrays', () => {
    expect(savedColorsDiffer([RED, GREEN], [RED, GREEN])).toBe(false);
    expect(savedColorsDiffer([], [])).toBe(false);
  });

  it('detects rgb-only vs kelvin entries with same rgb', () => {
    // 3-tuple rgb vs 4-tuple kelvin → different palette slots even with same rgb.
    const rgb: [number, number, number] = [255, 200, 100];
    const kelvin: [number, number, number, number] = [255, 200, 100, 3500];
    expect(savedColorsDiffer([rgb], [kelvin])).toBe(true);
    expect(savedColorsDiffer([kelvin], [rgb])).toBe(true);
  });

  it('detects kelvin-vs-kelvin difference when k differs', () => {
    expect(savedColorsDiffer([[200, 200, 200, 4000]], [[200, 200, 200, 5000]])).toBe(true);
  });

  it('returns false for identical kelvin entries', () => {
    expect(savedColorsDiffer([[200, 200, 200, 4000]], [[200, 200, 200, 4000]])).toBe(false);
  });
});

describe('readSavedColorsFromSource (R201 kelvin entries)', () => {
  it('reads 4-tuple kelvin entries with valid k', () => {
    const hass = stubHass({
      'input_text.palette': {
        state: JSON.stringify([[255, 200, 100, 3500], [200, 220, 255, 6500]]),
        attributes: {},
      },
    });
    const result = readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    );
    expect(result).toEqual([
      [255, 200, 100, 3500],
      [200, 220, 255, 6500],
    ]);
  });

  it('drops kelvin element if k is out of range (< 1000 or > 10000)', () => {
    const hass = stubHass({
      'input_text.palette': {
        state: JSON.stringify([[255, 200, 100, 999], [200, 220, 255, 12000]]),
        attributes: {},
      },
    });
    const result = readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    );
    // Both entries' kelvin out-of-range → fall back to 3-tuple rgb-only.
    expect(result).toEqual([
      [255, 200, 100],
      [200, 220, 255],
    ]);
  });

  it('mixes legacy 3-tuple and r39 4-tuple in the same palette', () => {
    const hass = stubHass({
      'input_text.palette': {
        state: JSON.stringify([[255, 0, 0], [255, 200, 100, 3500]]),
        attributes: {},
      },
    });
    const result = readSavedColorsFromSource(
      hass as never,
      { source: 'helper:input_text.palette' },
      [],
    );
    expect(result).toEqual([
      [255, 0, 0],          // legacy rgb-only stays 3-tuple
      [255, 200, 100, 3500], // kelvin stays 4-tuple
    ]);
  });
});
