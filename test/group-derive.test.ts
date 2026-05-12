/**
 * Tests for `helpers/group-derive.ts` — pure derive helpers extracted
 * from `group-layout-expanded.ts` in P15-Phase-2 r33b.
 */
import { describe, it, expect } from 'vitest';
import {
  groupName,
  memberLabel,
  toMindmapMembers,
  isLightOn,
  resolveEntityIcon,
} from '../src/helpers/group-derive.js';

type HassShim = {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
};

const stubHass = (states: HassShim['states']): HassShim => ({ states });

describe('groupName', () => {
  it('returns friendly_name when set', () => {
    const hass = stubHass({
      'light.hall_spots': { state: 'on', attributes: { friendly_name: 'Hall' } },
    });
    expect(groupName(hass as never, 'light.hall_spots')).toBe('Hall');
  });

  it('falls back to entity_id when no friendly_name', () => {
    const hass = stubHass({ 'light.hall_spots': { state: 'on', attributes: {} } });
    expect(groupName(hass as never, 'light.hall_spots')).toBe('light.hall_spots');
  });

  it('falls back to entity_id when entity missing', () => {
    expect(groupName(undefined, 'light.gone')).toBe('light.gone');
  });
});

describe('memberLabel', () => {
  it('returns friendly_name when set', () => {
    const hass = stubHass({
      'light.hall_spot_1': { state: 'on', attributes: { friendly_name: 'Spot One' } },
    });
    expect(memberLabel(hass as never, 'light.hall_spot_1')).toBe('Spot One');
  });

  it('humanises the entity_id tail when no friendly_name', () => {
    const hass = stubHass({ 'light.hall_spot_1': { state: 'on', attributes: {} } });
    expect(memberLabel(hass as never, 'light.hall_spot_1')).toBe('Hall Spot 1');
  });

  it('handles entity_ids without a domain prefix', () => {
    const hass = stubHass({ 'no_domain_id': { state: 'on', attributes: {} } });
    expect(memberLabel(hass as never, 'no_domain_id')).toBe('No Domain Id');
  });
});

describe('toMindmapMembers', () => {
  it('extracts state + rgb + brightness for each member', () => {
    const hass = stubHass({
      'light.a': {
        state: 'on',
        attributes: { rgb_color: [255, 0, 0], brightness: 200 },
      },
      'light.b': { state: 'off', attributes: {} },
    });
    expect(toMindmapMembers(hass as never, ['light.a', 'light.b'])).toEqual([
      { state: 'on', rgb: [255, 0, 0], brightness: 200 },
      { state: 'off', rgb: undefined, brightness: undefined },
    ]);
  });

  it('returns "unavailable" stub for missing entities', () => {
    const hass = stubHass({});
    expect(toMindmapMembers(hass as never, ['light.gone'])).toEqual([
      { state: 'unavailable' },
    ]);
  });
});

describe('isLightOn', () => {
  it('true when entity state === "on"', () => {
    const hass = stubHass({ 'light.a': { state: 'on', attributes: {} } });
    expect(isLightOn(hass as never, 'light.a')).toBe(true);
  });

  it('false for state "off" / "unavailable" / "unknown"', () => {
    const hass = stubHass({
      'light.off': { state: 'off', attributes: {} },
      'light.una': { state: 'unavailable', attributes: {} },
      'light.unk': { state: 'unknown', attributes: {} },
    });
    expect(isLightOn(hass as never, 'light.off')).toBe(false);
    expect(isLightOn(hass as never, 'light.una')).toBe(false);
    expect(isLightOn(hass as never, 'light.unk')).toBe(false);
  });

  it('false when entity missing', () => {
    expect(isLightOn(undefined, 'light.gone')).toBe(false);
  });
});

describe('resolveEntityIcon', () => {
  it('prefers state.attributes.icon over override + fallback', () => {
    const hass = stubHass({
      'light.a': { state: 'on', attributes: { icon: 'mdi:track-light' } },
    });
    expect(
      resolveEntityIcon(hass as never, 'light.a', 'mdi:lightbulb', 'mdi:bulb-outline'),
    ).toBe('mdi:track-light');
  });

  it('uses override when state has no icon', () => {
    const hass = stubHass({ 'light.a': { state: 'on', attributes: {} } });
    expect(
      resolveEntityIcon(hass as never, 'light.a', 'mdi:lightbulb', 'mdi:bulb-outline'),
    ).toBe('mdi:bulb-outline');
  });

  it('uses fallback when neither state.icon nor override set', () => {
    const hass = stubHass({ 'light.a': { state: 'on', attributes: {} } });
    expect(resolveEntityIcon(hass as never, 'light.a', 'mdi:lightbulb')).toBe('mdi:lightbulb');
  });

  it('uses fallback when entity missing entirely', () => {
    expect(resolveEntityIcon(undefined, 'light.gone', 'mdi:lightbulb')).toBe('mdi:lightbulb');
  });
});
