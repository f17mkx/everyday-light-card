/**
 * Group tap-toggle with last-state restore (CONCEPT.md R3, Stefan-Decision A1).
 *
 * Behavior
 *   group is on  → snapshot its members into a per-group scene, then turn off.
 *   group is off → restore the snapshot scene; if the scene doesn't exist yet
 *                   (first-ever toggle, or someone deleted it), fall back to a
 *                   plain `light.turn_on` so the user still gets the lights on.
 *
 * Scene naming
 *   `scene.everyday_group_<sanitized_group_id>` - the `everyday_group_` prefix
 *   makes them easy for Stefan to spot (and bulk-delete) in the HA scene
 *   registry. The sanitization replaces dots with underscores so HA accepts
 *   the id (scene_ids cannot contain dots).
 *
 * Idempotency
 *   `scene.create` overwrites the same scene_id every time, so toggling
 *   on→off→on→off keeps the snapshot fresh without piling up scenes.
 */

import type { HomeAssistant } from 'custom-card-helpers';

const SCENE_NAME_PREFIX = 'everyday_group_';

/** Build the scene_id (no domain) from a group entity id. */
function sceneNameFor(groupEntityId: string): string {
  return `${SCENE_NAME_PREFIX}${groupEntityId.replace(/\./g, '_')}`;
}

export function sceneEntityIdFor(groupEntityId: string): string {
  return `scene.${sceneNameFor(groupEntityId)}`;
}

export async function groupToggleWithRestore(
  hass: HomeAssistant,
  groupEntityId: string,
  memberIds: string[],
): Promise<void> {
  const groupState = hass.states[groupEntityId];
  if (!groupState) return;
  const sceneName = sceneNameFor(groupEntityId);
  const sceneEntityId = `scene.${sceneName}`;

  if (groupState.state === 'on') {
    // Snapshot the members BEFORE turning off, so the next on-tap can restore them.
    // Failure tolerant: if scene.create errors (perms, transient HA issue), still
    // proceed with the turn_off so the user gets the action they asked for.
    try {
      await hass.callService('scene', 'create', {
        scene_id: sceneName,
        snapshot_entities: memberIds,
      });
    } catch {
      /* swallow - the user-facing action is the turn_off. */
    }
    await hass.callService('light', 'turn_off', { entity_id: groupEntityId });
    return;
  }

  // Group currently off → restore via the saved scene if it exists, otherwise
  // fall back to a plain group turn-on (HA's own last-state behavior kicks in).
  const sceneExists = !!hass.states[sceneEntityId];
  if (sceneExists) {
    try {
      await hass.callService('scene', 'turn_on', { entity_id: sceneEntityId });
      return;
    } catch {
      /* fall through */
    }
  }
  await hass.callService('light', 'turn_on', { entity_id: groupEntityId });
}
