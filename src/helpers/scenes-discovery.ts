/**
 * scenes-discovery - Stefan-2026-05-16 PA-0001 (+ PA-0004 fix).
 *
 * Find every `scene.*` entity in HA that targets the given light entity.
 * Two parallel match paths:
 *
 *   1. **entity_id intersection** (works for HA-native scenes + light_group
 *      members). Each `scene.*` may expose an `entity_id` attribute listing
 *      the lights it controls. Match when that list intersects the target
 *      light's leaves (the light's own `entity_id` attribute when it's a
 *      group, or just `[entity]` when leaf).
 *
 *   2. **Hue `group_name` match** (PA-0004 fix — Stefan 2026-05-16):
 *      Hue-bridge integration creates `scene.*` entities WITHOUT an
 *      `entity_id` attribute. Instead they expose `group_name` (= the Hue
 *      room friendly_name, e.g. "Wohnzimmer") and `group_type: "room"`.
 *      Match when `scene.group_name` (case-insensitive trim) equals the
 *      target light's `friendly_name` AND the target light is itself a
 *      Hue room (`is_hue_group: true`, `hue_type: 'room'`). This is the
 *      ONLY path that finds Hue scenes — entity_id intersection would
 *      return zero results and the popup would silently self-close.
 *      Stefan-Quote PA-0004: "doppel tap auf 'wohnzimmer' oder
 *      'schlafzimmer' hat keinen effekt" — root cause was discovery
 *      returning empty.
 *
 * Optionally accepts an explicit override list (`scenes_picker.scenes`)
 * which short-circuits auto-discovery — caller passes the list and the
 * function just resolves them to display objects.
 *
 * Display name handling: when `stripPrefix` is true the light's friendly
 * name (lowercased) is stripped from the scene's friendly_name prefix.
 * "Wohnzimmer Konzentriert" → "Konzentriert" when the target is
 * `light.wohnzimmer`. Hue-app convention — every scene in a room is
 * named "<Room> <Scene>" so the room prefix is redundant once the user
 * is already inside that room's card.
 */

import type { HomeAssistant } from 'custom-card-helpers';

/**
 * Stefan-2026-05-16 PA-0003: filter out the internal snapshot scenes
 * created by `groupToggleWithRestore` (see helpers/group-toggle.ts:23
 * `SCENE_NAME_PREFIX`). Those scenes look like
 * `scene.everyday_group_light_wohnzimmer` and are pure machinery — they
 * exist to restore a group's per-member state after toggle-off, NOT to
 * be picked by a user. Showing them in the scenes-list popup confuses
 * Tobi-style users: "the only scene is `everyday_group_light_wohnzimmer`
 * — that looks wrong". Hidden from auto-discovery AND the explicit
 * override path.
 */
const SNAPSHOT_SCENE_PREFIX = 'scene.everyday_group_';

function isSnapshotScene(sceneId: string): boolean {
  return sceneId.startsWith(SNAPSHOT_SCENE_PREFIX);
}

export interface DiscoveredScene {
  /** `scene.foo` entity_id passed to `scene.turn_on`. */
  id: string;
  /** User-facing label (friendly_name, optionally with prefix stripped). */
  name: string;
}

interface DiscoveryOptions {
  /** Explicit list of scene entity_ids. When set, skip intersection. */
  override?: string[];
  /** Strip the target light's friendly_name prefix from each scene name. */
  stripPrefix?: boolean;
}

/**
 * Resolve target → set of leaf entity_ids the scene should intersect.
 * For a leaf light the set is `{ entityId }`. For a group light the set
 * is the contents of its own `entity_id` attribute (light_group exposes
 * it; Hue room-groups expose it too via the bridge integration).
 */
function resolveTargetLeaves(
  hass: HomeAssistant,
  entityId: string,
): Set<string> {
  const result = new Set<string>([entityId]);
  const state = hass.states[entityId];
  const children = state?.attributes?.entity_id;
  if (Array.isArray(children)) {
    for (const c of children) {
      if (typeof c === 'string') result.add(c);
    }
  }
  return result;
}

/**
 * Strip the light's friendly_name from the scene's friendly_name when
 * present as a leading word. Case-insensitive, whitespace-trimmed.
 */
function stripLightPrefix(sceneName: string, lightName: string | undefined): string {
  if (!lightName) return sceneName;
  const prefix = lightName.trim().toLowerCase();
  if (!prefix) return sceneName;
  const lower = sceneName.toLowerCase();
  if (!lower.startsWith(prefix)) return sceneName;
  // Strip prefix + any single separator (space, hyphen, en-dash, colon).
  const stripped = sceneName.slice(prefix.length).replace(/^[\s\-–:·_]+/, '');
  // Empty after strip → fall back to original so the user still sees a label.
  return stripped || sceneName;
}

/**
 * Stefan-2026-05-16 PA-0004: read the Hue-room friendly_name from the
 * target light when it's a Hue room. Returns undefined for non-Hue
 * lights (or Hue zones / unknown types) so the group_name match path
 * stays scoped to actual Hue rooms. We deliberately do NOT match on
 * `hue_type: 'zone'` here — Hue zones can overlap rooms in ways that
 * make scene-intersection ambiguous; users who want zone scenes can
 * supply them via `scenes_picker.scenes` explicit override.
 */
function resolveHueRoomName(
  hass: HomeAssistant,
  entityId: string,
): string | undefined {
  const state = hass.states[entityId];
  if (!state) return undefined;
  const isHueGroup = state.attributes?.is_hue_group === true;
  const hueType = state.attributes?.hue_type as string | undefined;
  if (!isHueGroup || hueType !== 'room') return undefined;
  const fn = state.attributes?.friendly_name as string | undefined;
  return typeof fn === 'string' && fn.trim().length > 0 ? fn.trim() : undefined;
}

/**
 * Build the discovered-scenes list for the target light entity.
 *
 * Returns an alphabetically-sorted (by display name) list. Stable so the
 * picker doesn't re-shuffle between renders when hass updates.
 */
export function discoverScenesForEntity(
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
  options: DiscoveryOptions = {},
): DiscoveredScene[] {
  if (!hass || !entityId) return [];
  const stripPrefix = options.stripPrefix !== false;
  const lightName = hass.states[entityId]?.attributes?.friendly_name as
    | string
    | undefined;

  // Explicit override path — caller supplied a curated list. Resolve each
  // id against hass.states for display names; skip ids that don't exist.
  if (options.override && options.override.length > 0) {
    const out: DiscoveredScene[] = [];
    for (const id of options.override) {
      if (typeof id !== 'string' || !id.startsWith('scene.')) continue;
      if (isSnapshotScene(id)) continue;
      const s = hass.states[id];
      if (!s) continue;
      const name = (s.attributes?.friendly_name as string | undefined) ?? id;
      out.push({
        id,
        name: stripPrefix ? stripLightPrefix(name, lightName) : name,
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

  // Auto-discovery path. Match via EITHER (a) entity_id intersection OR
  // (b) Hue group_name equality. The two paths are unioned by entity-id
  // (a scene matched by both gets deduplicated).
  const leaves = resolveTargetLeaves(hass, entityId);
  const hueRoom = resolveHueRoomName(hass, entityId);
  const hueRoomLower = hueRoom?.toLowerCase();
  const found: DiscoveredScene[] = [];
  const seen = new Set<string>();
  for (const stateId of Object.keys(hass.states)) {
    if (!stateId.startsWith('scene.')) continue;
    if (isSnapshotScene(stateId)) continue;
    if (seen.has(stateId)) continue;
    const s = hass.states[stateId];
    if (!s) continue;

    // (a) entity_id intersection — works for HA-native + light_group scenes.
    let intersects = false;
    const targets = s.attributes?.entity_id;
    if (Array.isArray(targets)) {
      for (const t of targets) {
        if (typeof t === 'string' && leaves.has(t)) {
          intersects = true;
          break;
        }
      }
    }

    // (b) Hue group_name match — works for Hue-bridge scenes which DON'T
    // populate entity_id. Only meaningful when the target light is itself
    // a Hue room.
    if (!intersects && hueRoomLower) {
      const groupName = s.attributes?.group_name;
      const groupType = s.attributes?.group_type;
      if (
        typeof groupName === 'string'
        && groupType === 'room'
        && groupName.trim().toLowerCase() === hueRoomLower
      ) {
        intersects = true;
      }
    }

    if (!intersects) continue;
    seen.add(stateId);
    const name = (s.attributes?.friendly_name as string | undefined) ?? stateId;
    found.push({
      id: stateId,
      name: stripPrefix ? stripLightPrefix(name, lightName) : name,
    });
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  return found;
}
