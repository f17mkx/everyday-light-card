/**
 * Group resolution - figures out whether the user-passed entity is itself a
 * Home-Assistant light group and returns the canonical
 * `(groupEntityId, memberIds)` pair.
 *
 * Rules (CONCEPT.md A5, Stefan-2026-05-11 single-light-explicit decision)
 *   1. If `manualMembers` is set → use it as-is, treat `entityId` as the group.
 *   2. If `entityId`'s state has an `entity_id` array attribute (HA's group
 *      convention) → it is a group.
 *   3. Otherwise return null → the card renders the single-light view.
 *
 * Stefan-2026-05-11 (R234, pre-launch): the prior parent-walk behaviour
 * (scan `hass.states` for any light.* group containing `entityId` and
 * auto-render that group) is intentionally removed. Stefan-Quote:
 * "if the light is a group (not part of a group) only then it makes sense
 * to show it as a group". Passing a member-entity in YAML now renders just
 * that single light. If the user wants the group view they must point the
 * card at the group entity itself.
 */

import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';
import type {
  EverydayLightCardConfig,
  ManualMember,
} from '../types/config.js';

export interface ResolvedGroup {
  /** The light.* entity that owns the membership (the "group" entity). */
  groupEntityId: string;
  /** Member entity ids in HA-native ordering. Length ≥ 2 by construction. */
  memberIds: string[];
  /** Convenience: the group's own state object. */
  groupState: HassEntity;
  /**
   * Stefan-2026-05-10 P15.6-r48 (R208): per-member config overrides, keyed
   * by entity_id. When a member entry was the nested object form
   * `{ entity, group, ... }`, its config lives here. The render path
   * checks this map per member-tile to decide whether to render an
   * embedded child card or the regular slider tile. Bare-string members
   * have no entry (rendered as legacy flat tile).
   */
  memberConfigs: Map<string, Partial<EverydayLightCardConfig>>;
}

function getMembersFromState(state: HassEntity | undefined): string[] | null {
  // Different group integrations expose member ids under different attribute
  // names. Hue lights publish `entity_id`; HA's `light: platform: group`
  // publishes `group_entities`. Accept either - same shape (string array).
  const raw =
    (state?.attributes?.entity_id as unknown) ??
    (state?.attributes?.group_entities as unknown);
  if (!Array.isArray(raw)) return null;
  const onlyStrings = (raw as unknown[]).filter((x): x is string => typeof x === 'string');
  return onlyStrings.length >= 2 ? onlyStrings : null;
}

/**
 * Stefan-2026-05-10 P15.6-r48 (R208): split a `ManualMember[]` into the
 * legacy `string[]` shape PLUS a per-member config map. Bare strings
 * become entity-ids only. Object-form entries contribute both the entity
 * AND their per-member config (for nested-render).
 */
function splitManualMembers(
  manualMembers: ManualMember[] | undefined,
): { ids: string[]; configs: Map<string, Partial<EverydayLightCardConfig>> } {
  const ids: string[] = [];
  const configs = new Map<string, Partial<EverydayLightCardConfig>>();
  if (!manualMembers) return { ids, configs };
  for (const m of manualMembers) {
    if (typeof m === 'string') {
      ids.push(m);
    } else if (m && typeof m.entity === 'string') {
      ids.push(m.entity);
      // Strip the `entity` key from the per-member config — entity is
      // already in `ids`, the rest is the override payload.
      const { entity: _entity, ...overrides } = m;
      configs.set(m.entity, overrides);
    }
  }
  return { ids, configs };
}

export function resolveGroup(
  hass: HomeAssistant | undefined,
  entityId: string,
  manualMembers?: ManualMember[],
): ResolvedGroup | null {
  if (!hass || !entityId) return null;
  const state = hass.states[entityId];
  if (!state) return null;

  // 1. manual override (CONCEPT A5 / config schema `group.manual_members`)
  // Stefan-2026-05-10 P15.6-r48 (R208): manual_members is now `Member[]`
  // — split into ids + per-member-configs for nested-render.
  if (manualMembers && manualMembers.length >= 2) {
    const { ids, configs } = splitManualMembers(manualMembers);
    if (ids.length >= 2) {
      return {
        groupEntityId: entityId,
        memberIds: ids,
        groupState: state,
        memberConfigs: configs,
      };
    }
  }

  // 2. entity is itself a group (the common case Stefan ships)
  const directMembers = getMembersFromState(state);
  if (directMembers) {
    return {
      groupEntityId: entityId,
      memberIds: directMembers,
      groupState: state,
      memberConfigs: new Map(),
    };
  }

  // 3. entity is NOT itself a group → single-light view.
  // Stefan-2026-05-11 (R234): the prior parent-walk was removed. The card
  // now always treats a member-entity as a single light, never as a stand-in
  // for the parent group. If the user wants the group, they must pass the
  // group entity_id.
  return null;
}
