/**
 * Tests for `helpers/group-toggle.ts` — the scene-snapshot toggle that
 * preserves per-member state across off → on transitions.
 *
 * Stefan-2026-05-10 P16-bootstrap (commit follow-up to group-detection).
 * Validates:
 *   - sceneEntityIdFor naming (dots → underscores)
 *   - on → off path: scene.create + light.turn_off
 *   - off → on path with existing scene: scene.turn_on
 *   - off → on fallback: light.turn_on when scene missing
 *   - failure-tolerance: scene.create errors don't block the turn_off
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupToggleWithRestore, sceneEntityIdFor } from '../src/helpers/group-toggle.js';

type HassShim = {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
  callService: ReturnType<typeof vi.fn>;
};

const stubHass = (
  states: HassShim['states'],
  callServiceImpl?: () => Promise<unknown>,
): HassShim => ({
  states,
  callService: vi.fn(callServiceImpl ?? (async () => undefined)),
});

describe('sceneEntityIdFor', () => {
  it('replaces dots with underscores in the scene_id', () => {
    expect(sceneEntityIdFor('light.hall_spots')).toBe('scene.everyday_group_light_hall_spots');
  });

  it('handles a group with no dots gracefully (rare but legal)', () => {
    expect(sceneEntityIdFor('hall_spots')).toBe('scene.everyday_group_hall_spots');
  });
});

describe('groupToggleWithRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns without action when the group entity does not exist', async () => {
    const hass = stubHass({});
    await groupToggleWithRestore(hass as never, 'light.does_not_exist', []);
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('on → off: snapshots members via scene.create then turns off', async () => {
    const hass = stubHass({
      'light.hall_spots': { state: 'on', attributes: {} },
    });
    await groupToggleWithRestore(
      hass as never,
      'light.hall_spots',
      ['light.hall_spot_1', 'light.hall_spot_2'],
    );
    expect(hass.callService).toHaveBeenCalledTimes(2);
    expect(hass.callService).toHaveBeenNthCalledWith(1, 'scene', 'create', {
      scene_id: 'everyday_group_light_hall_spots',
      snapshot_entities: ['light.hall_spot_1', 'light.hall_spot_2'],
    });
    expect(hass.callService).toHaveBeenNthCalledWith(2, 'light', 'turn_off', {
      entity_id: 'light.hall_spots',
    });
  });

  it('on → off: still turns off even when scene.create throws', async () => {
    let callIdx = 0;
    const callServiceImpl = vi.fn(async (...args: unknown[]) => {
      callIdx++;
      if (callIdx === 1) throw new Error('scene-create-failed');
      return undefined;
    });
    const hass: HassShim = {
      states: { 'light.hall_spots': { state: 'on', attributes: {} } },
      callService: callServiceImpl,
    };
    await groupToggleWithRestore(
      hass as never,
      'light.hall_spots',
      ['light.hall_spot_1', 'light.hall_spot_2'],
    );
    // Both calls fired despite the first one throwing — failure-tolerance.
    expect(hass.callService).toHaveBeenCalledTimes(2);
    expect(hass.callService).toHaveBeenNthCalledWith(2, 'light', 'turn_off', {
      entity_id: 'light.hall_spots',
    });
  });

  it('off → on with existing scene: restores via scene.turn_on', async () => {
    const hass = stubHass({
      'light.hall_spots': { state: 'off', attributes: {} },
      'scene.everyday_group_light_hall_spots': { state: 'unknown', attributes: {} },
    });
    await groupToggleWithRestore(
      hass as never,
      'light.hall_spots',
      ['light.hall_spot_1'],
    );
    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith('scene', 'turn_on', {
      entity_id: 'scene.everyday_group_light_hall_spots',
    });
  });

  it('off → on with no scene: falls back to light.turn_on', async () => {
    const hass = stubHass({
      'light.hall_spots': { state: 'off', attributes: {} },
      // scene.everyday_group_light_hall_spots intentionally missing.
    });
    await groupToggleWithRestore(
      hass as never,
      'light.hall_spots',
      ['light.hall_spot_1'],
    );
    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith('light', 'turn_on', {
      entity_id: 'light.hall_spots',
    });
  });

  it('off → on falls back to light.turn_on when scene.turn_on throws', async () => {
    let callIdx = 0;
    const callServiceImpl = vi.fn(async (...args: unknown[]) => {
      callIdx++;
      if (callIdx === 1) throw new Error('scene-restore-failed');
      return undefined;
    });
    const hass: HassShim = {
      states: {
        'light.hall_spots': { state: 'off', attributes: {} },
        'scene.everyday_group_light_hall_spots': { state: 'unknown', attributes: {} },
      },
      callService: callServiceImpl,
    };
    await groupToggleWithRestore(
      hass as never,
      'light.hall_spots',
      ['light.hall_spot_1'],
    );
    expect(hass.callService).toHaveBeenCalledTimes(2);
    expect(hass.callService).toHaveBeenNthCalledWith(2, 'light', 'turn_on', {
      entity_id: 'light.hall_spots',
    });
  });
});
