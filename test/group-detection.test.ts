/**
 * Tests for `helpers/group-detection.ts` — the function that turns a
 * card config + HA state into a resolved group (master entity_id +
 * member entity_ids). Pure logic, no DOM.
 *
 * Stefan-2026-05-10 P16-bootstrap: first test file. Establishes the
 * vitest pattern so future contributors have a reference.
 */
import { describe, it, expect } from 'vitest';
import { resolveGroup } from '../src/helpers/group-detection.js';

/**
 * Minimal `hass` shim — only the fields `resolveGroup` reads. Avoids
 * pulling in the full HomeAssistant type from custom-card-helpers in
 * test code (its surface is huge and we only need `states`).
 */
type HassShim = {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
};

const stubHass = (states: HassShim['states']): HassShim => ({ states });

describe('resolveGroup', () => {
  it('returns null for a non-existent entity', () => {
    const hass = stubHass({});
    expect(resolveGroup(hass as never, 'light.does_not_exist')).toBeNull();
  });

  it('returns null for a single-light entity (no group attributes, no parent group)', () => {
    const hass = stubHass({
      'light.bedroom': {
        state: 'on',
        attributes: { friendly_name: 'Bedroom' },
      },
    });
    expect(resolveGroup(hass as never, 'light.bedroom')).toBeNull();
  });

  it('resolves an HA-native light group via attributes.entity_id', () => {
    const hass = stubHass({
      'light.hall_spots': {
        state: 'on',
        attributes: {
          entity_id: ['light.hall_spot_1', 'light.hall_spot_2', 'light.hall_spot_3'],
        },
      },
      'light.hall_spot_1': { state: 'on', attributes: {} },
      'light.hall_spot_2': { state: 'off', attributes: {} },
      'light.hall_spot_3': { state: 'on', attributes: {} },
    });
    const result = resolveGroup(hass as never, 'light.hall_spots');
    expect(result).not.toBeNull();
    expect(result?.groupEntityId).toBe('light.hall_spots');
    expect(result?.memberIds).toEqual([
      'light.hall_spot_1',
      'light.hall_spot_2',
      'light.hall_spot_3',
    ]);
  });

  it('honors manual_members override over HA-native group', () => {
    const hass = stubHass({
      'light.hall_spots': {
        state: 'on',
        attributes: {
          entity_id: ['light.hall_spot_1', 'light.hall_spot_2', 'light.hall_spot_3'],
        },
      },
      'light.hall_spot_1': { state: 'on', attributes: {} },
      'light.hall_spot_2': { state: 'off', attributes: {} },
    });
    const result = resolveGroup(hass as never, 'light.hall_spots', [
      'light.hall_spot_1',
      'light.hall_spot_2',
    ]);
    expect(result?.memberIds).toEqual(['light.hall_spot_1', 'light.hall_spot_2']);
  });

  it('rejects a group with fewer than 2 members (single-light path)', () => {
    const hass = stubHass({
      'light.fake_solo_group': {
        state: 'on',
        attributes: { entity_id: ['light.lonely'] },  // only 1 member
      },
      'light.lonely': { state: 'on', attributes: {} },
    });
    // Single-member arrays return null per the >= 2 invariant in
    // getMembersFromState — the card falls back to single-slider view.
    expect(resolveGroup(hass as never, 'light.fake_solo_group')).toBeNull();
  });

  it('returns null when given a member entity_id (single-light view, R234)', () => {
    // Stefan-2026-05-11 R234: passing a member-entity must NOT auto-render
    // the parent group. The card renders the single light. If the user wants
    // the group view, they pass the group entity itself.
    const hass = stubHass({
      'light.hall_spots': {
        state: 'on',
        attributes: {
          entity_id: ['light.hall_spot_1', 'light.hall_spot_2'],
        },
      },
      'light.hall_spot_1': { state: 'on', attributes: {} },
      'light.hall_spot_2': { state: 'off', attributes: {} },
    });
    expect(resolveGroup(hass as never, 'light.hall_spot_1')).toBeNull();
  });

  it('accepts the alternative group_entities attribute name', () => {
    const hass = stubHass({
      'light.hue_room': {
        state: 'on',
        attributes: {
          // Some integrations publish under group_entities, not entity_id.
          group_entities: ['light.bulb_a', 'light.bulb_b'],
        },
      },
      'light.bulb_a': { state: 'on', attributes: {} },
      'light.bulb_b': { state: 'on', attributes: {} },
    });
    const result = resolveGroup(hass as never, 'light.hue_room');
    expect(result?.memberIds).toEqual(['light.bulb_a', 'light.bulb_b']);
  });
});
