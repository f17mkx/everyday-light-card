/**
 * group-derive.ts — pure derive helpers for group-layout-expanded.
 *
 * Stefan-2026-05-10 P15-Phase-2 r33b: extracted from
 * `components/group-layout-expanded.ts` so the host class no longer
 * needs to host these read-only utilities. Every function here is
 * pure — no class state, no DOM, no service calls. Takes `hass` (or a
 * subset of state) plus entity-ids and returns derived data.
 *
 * Why extract: ~50 LOC of utility methods that don't really belong on
 * the host class. They're more like a small internal module of read-
 * only state queries. Co-located here, future cards (or unit tests)
 * can import + reuse them without instantiating the Lit element.
 */

import type { HomeAssistant } from 'custom-card-helpers';
import type { MindmapMember } from '../components/mindmap-path.js';

/**
 * Friendly-name resolution: state attribute first, fall back to
 * entity_id. Mirrors HA's display convention.
 */
export function groupName(
  hass: HomeAssistant | undefined,
  groupEntityId: string,
): string {
  const s = hass?.states[groupEntityId];
  return (s?.attributes?.friendly_name as string | undefined) ?? groupEntityId;
}

/**
 * Member-label resolution: friendly_name from state, else humanise
 * the entity_id tail (`light.hall_door` → "Hall Door").
 */
export function memberLabel(
  hass: HomeAssistant | undefined,
  memberId: string,
): string {
  const s = hass?.states[memberId];
  const friendly = s?.attributes?.friendly_name as string | undefined;
  if (friendly) return friendly;
  // entity_id like "light.hall_door" → "Hall Door"
  const tail = memberId.split('.').slice(1).join('.') || memberId;
  return tail.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Convert HA states into the MindmapMember shape that
 * `<everyday-mindmap-path>` consumes. Missing entities → `'unavailable'`
 * stub so the mindmap still renders the right shape but with neutral
 * colours.
 */
export function toMindmapMembers(
  hass: HomeAssistant | undefined,
  memberIds: string[],
): MindmapMember[] {
  return memberIds.map((id) => {
    const s = hass?.states[id];
    if (!s) return { state: 'unavailable' };
    return {
      state: s.state,
      rgb: s.attributes.rgb_color as [number, number, number] | undefined,
      brightness: s.attributes.brightness as number | undefined,
    };
  });
}

/**
 * Generic on-state check. Used for both members and groups so a single
 * function replaces what was `_isMemberOn` + `_isGroupOn`.
 */
export function isLightOn(
  hass: HomeAssistant | undefined,
  entityId: string,
): boolean {
  return hass?.states[entityId]?.state === 'on';
}

/**
 * Icon resolution chain:
 *   1. state.attributes.icon (HA entity-registry icon — user-customised)
 *   2. config-supplied override
 *   3. domain default (passed in as `fallback`)
 *
 * Stefan-2026-05-10 R150 — Cards 4/5/6a previously rendered all members
 * with a shared override or `mdi:lightbulb` fallback, losing entity-
 * specific icons that show correctly on Card 6b. This chain restores
 * that fidelity.
 */
export function resolveEntityIcon(
  hass: HomeAssistant | undefined,
  entityId: string,
  fallback: string,
  override?: string,
): string {
  const stateIcon = hass?.states[entityId]?.attributes?.icon as string | undefined;
  return stateIcon ?? override ?? fallback;
}
