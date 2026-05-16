/**
 * Tests for `helpers/scenes-discovery.ts` — the scene-intersection helper
 * that powers the `scenes_list` gesture action (Stefan-2026-05-16 PA-0001).
 *
 * Mirrors the group-detection test pattern: HassShim stub, no DOM.
 */
import { describe, it, expect } from 'vitest';
import { discoverScenesForEntity } from '../src/helpers/scenes-discovery.js';

type HassShim = {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
};

const stubHass = (states: HassShim['states']): HassShim => ({ states });

describe('discoverScenesForEntity', () => {
  it('returns empty when hass is undefined', () => {
    expect(discoverScenesForEntity(undefined, 'light.wohnzimmer')).toEqual([]);
  });

  it('returns empty when entityId is undefined', () => {
    const hass = stubHass({});
    expect(discoverScenesForEntity(hass as never, undefined)).toEqual([]);
  });

  it('returns empty when no scenes target the entity', () => {
    const hass = stubHass({
      'light.bedroom': { state: 'on', attributes: { friendly_name: 'Bedroom' } },
      'scene.someother': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Other Room Scene',
          entity_id: ['light.kitchen'],
        },
      },
    });
    expect(discoverScenesForEntity(hass as never, 'light.bedroom')).toEqual([]);
  });

  it('finds scenes targeting a leaf light directly', () => {
    const hass = stubHass({
      'light.bedroom': {
        state: 'on',
        attributes: { friendly_name: 'Bedroom' },
      },
      'scene.bedroom_konzentriert': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Bedroom Konzentriert',
          entity_id: ['light.bedroom'],
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.bedroom');
    expect(result).toEqual([
      { id: 'scene.bedroom_konzentriert', name: 'Konzentriert' },
    ]);
  });

  it('finds scenes whose entity_id intersects a group light\'s children', () => {
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'on',
        attributes: {
          friendly_name: 'Wohnzimmer',
          entity_id: ['light.couch', 'light.table'],
        },
      },
      'scene.wz_relax': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer Entspannen',
          entity_id: ['light.couch'],
        },
      },
      'scene.unrelated': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Kitchen Cook',
          entity_id: ['light.kitchen'],
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer');
    expect(result).toEqual([{ id: 'scene.wz_relax', name: 'Entspannen' }]);
  });

  it('sorts results alphabetically by display name', () => {
    const hass = stubHass({
      'light.wz': {
        state: 'on',
        attributes: { friendly_name: 'WZ', entity_id: ['light.couch'] },
      },
      'scene.zulu': {
        state: 'unknown',
        attributes: { friendly_name: 'WZ Zulu', entity_id: ['light.couch'] },
      },
      'scene.alpha': {
        state: 'unknown',
        attributes: { friendly_name: 'WZ Alpha', entity_id: ['light.couch'] },
      },
      'scene.mike': {
        state: 'unknown',
        attributes: { friendly_name: 'WZ Mike', entity_id: ['light.couch'] },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wz');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Mike', 'Zulu']);
  });

  it('honors stripPrefix=false to keep the full friendly_name', () => {
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'on',
        attributes: {
          friendly_name: 'Wohnzimmer',
          entity_id: ['light.couch'],
        },
      },
      'scene.wz_relax': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer Entspannen',
          entity_id: ['light.couch'],
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer', {
      stripPrefix: false,
    });
    expect(result[0].name).toEqual('Wohnzimmer Entspannen');
  });

  it('explicit override skips auto-discovery and resolves names', () => {
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'on',
        attributes: { friendly_name: 'Wohnzimmer', entity_id: ['light.couch'] },
      },
      // Note: this scene's entity_id does NOT intersect with wohnzimmer
      // but the override forces it in anyway.
      'scene.tobi_curated': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Tobi Kurierte Szene',
          entity_id: ['light.kitchen'],
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer', {
      override: ['scene.tobi_curated'],
    });
    expect(result).toEqual([
      { id: 'scene.tobi_curated', name: 'Tobi Kurierte Szene' },
    ]);
  });

  it('filters out everyday_group_* snapshot scenes from auto-discovery (PA-0003)', () => {
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'on',
        attributes: {
          friendly_name: 'Wohnzimmer',
          entity_id: ['light.couch'],
        },
      },
      'scene.everyday_group_light_wohnzimmer': {
        state: 'unknown',
        attributes: {
          friendly_name: 'everyday group light wohnzimmer',
          entity_id: ['light.couch'],
        },
      },
      'scene.real_user_scene': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer Konzentriert',
          entity_id: ['light.couch'],
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer');
    expect(result.map((s) => s.id)).toEqual(['scene.real_user_scene']);
  });

  it('filters out everyday_group_* even when supplied via explicit override (PA-0003)', () => {
    const hass = stubHass({
      'light.wohnzimmer': { state: 'on', attributes: { friendly_name: 'Wohnzimmer' } },
      'scene.everyday_group_light_wohnzimmer': {
        state: 'unknown',
        attributes: { friendly_name: 'snapshot', entity_id: [] },
      },
      'scene.user_picked': {
        state: 'unknown',
        attributes: { friendly_name: 'User Picked', entity_id: [] },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer', {
      override: ['scene.everyday_group_light_wohnzimmer', 'scene.user_picked'],
    });
    expect(result.map((s) => s.id)).toEqual(['scene.user_picked']);
  });

  it('PA-0004: discovers Hue-bridge scenes via group_name match (no entity_id attribute)', () => {
    // Hue-bridge integration creates scenes WITHOUT entity_id but WITH
    // group_name/group_type. The pre-PA-0004 code returned 0 scenes for
    // these and the popup self-closed → "double-tap has no effect".
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'off',
        attributes: {
          friendly_name: 'Wohnzimmer',
          is_hue_group: true,
          hue_type: 'room',
          entity_id: ['light.decke_2', 'light.couch_colour'],
        },
      },
      'scene.wohnzimmer_afterdinner': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer AfterDinner',
          group_name: 'Wohnzimmer',
          group_type: 'room',
          name: 'AfterDinner',
        },
      },
      'scene.wohnzimmer_nachts': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer Nachts',
          group_name: 'Wohnzimmer',
          group_type: 'room',
          name: 'Nachts',
        },
      },
      'scene.unrelated_room': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Kitchen Cook',
          group_name: 'Kitchen',
          group_type: 'room',
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer');
    expect(result.map((s) => s.id)).toEqual([
      'scene.wohnzimmer_afterdinner',
      'scene.wohnzimmer_nachts',
    ]);
    expect(result.map((s) => s.name)).toEqual(['AfterDinner', 'Nachts']);
  });

  it('PA-0004: case-insensitive group_name match for Hue scenes', () => {
    const hass = stubHass({
      'light.schlafzimmer': {
        state: 'off',
        attributes: {
          friendly_name: 'SCHLAFZIMMER',
          is_hue_group: true,
          hue_type: 'room',
        },
      },
      'scene.schlafzimmer_lesen': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Schlafzimmer Lesen',
          group_name: 'schlafzimmer',
          group_type: 'room',
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.schlafzimmer');
    expect(result.map((s) => s.id)).toEqual(['scene.schlafzimmer_lesen']);
  });

  it('PA-0004: skips group_name path for non-Hue lights', () => {
    // A light_group helper has entity_id but no is_hue_group flag. Hue
    // scenes that happen to share a name would NOT match unless the
    // light is itself a Hue room.
    const hass = stubHass({
      'light.tobi_all': {
        state: 'off',
        attributes: {
          friendly_name: 'Tobi All',
          entity_id: ['light.bulb1'],
        },
      },
      'scene.tobi_all_morning': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Tobi All Morning',
          group_name: 'Tobi All',
          group_type: 'room',
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.tobi_all');
    expect(result.map((s) => s.id)).toEqual([]);
  });

  it('PA-0004: zone-type Hue groups do not trigger the group_name path', () => {
    // Hue zones overlap rooms; explicit override is the path for zone scenes.
    const hass = stubHass({
      'light.living_zone': {
        state: 'off',
        attributes: {
          friendly_name: 'Living Zone',
          is_hue_group: true,
          hue_type: 'zone',
        },
      },
      'scene.living_zone_party': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Living Zone Party',
          group_name: 'Living Zone',
          group_type: 'zone',
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.living_zone');
    expect(result.map((s) => s.id)).toEqual([]);
  });

  it('PA-0004: entity_id intersection still wins when present + dedupe with group_name', () => {
    // Edge case: a scene that has BOTH entity_id AND group_name (unusual
    // but possible). Should appear once in results.
    const hass = stubHass({
      'light.wohnzimmer': {
        state: 'off',
        attributes: {
          friendly_name: 'Wohnzimmer',
          is_hue_group: true,
          hue_type: 'room',
          entity_id: ['light.bulb_a'],
        },
      },
      'scene.both_paths': {
        state: 'unknown',
        attributes: {
          friendly_name: 'Wohnzimmer Both',
          entity_id: ['light.bulb_a'],
          group_name: 'Wohnzimmer',
          group_type: 'room',
        },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer');
    expect(result.map((s) => s.id)).toEqual(['scene.both_paths']);
  });

  it('override silently skips non-existent or non-scene entries', () => {
    const hass = stubHass({
      'light.wohnzimmer': { state: 'on', attributes: { friendly_name: 'Wohnzimmer' } },
      'scene.exists': {
        state: 'unknown',
        attributes: { friendly_name: 'Exists', entity_id: [] },
      },
    });
    const result = discoverScenesForEntity(hass as never, 'light.wohnzimmer', {
      override: [
        'scene.does_not_exist',
        'light.not_a_scene',
        'scene.exists',
      ],
    });
    expect(result.map((s) => s.id)).toEqual(['scene.exists']);
  });
});
