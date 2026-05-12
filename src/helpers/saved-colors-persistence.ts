/**
 * saved-colors-persistence - Phase 15 deliverable.
 *
 * Pure-function helpers for the saved-colors palette source-of-truth flow
 * (P7.1 helper:input_text persistence). Extracted from group-layout-
 * expanded.ts so single-entity cards (everyday-light-card.ts) can reuse
 * the same read/write semantics when they grow saved-colors support.
 *
 * Source contract (matches `SavedColorsConfig`):
 *   - `static`: read once from `cfg.static`, never write back.
 *   - `helper:input_text.<id>`: JSON-encoded array in helper state, read
 *     on every hass push, write on every mutation. Validates each tuple
 *     is `[number, number, number]` in 0-255 range.
 *   - `ha_favorites`: research pending — current code returns null.
 *
 * Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): when no explicit source
 * is configured (the common case — no `saved_colors.source` in YAML), fall
 * back to HA's native `frontend/set_user_data` / `frontend/get_user_data`
 * WebSocket endpoints. Storage is per-user (server-side, syncs across
 * devices), namespaced under the `everyday_light_card` key, keyed by
 * entity_id inside a `saved_colors` sub-object. No HA helper required —
 * the user just uses the card, saves persist automatically. Stefan-Quote:
 * "cant we use the native way colors are saved for the default home
 * assistant light card? how do they do it?". HA's more-info-light doesn't
 * actually persist recent colors natively (verified live), but its
 * `frontend.set_user_data` API is the right native vehicle for this
 * pattern — see the live probe in `.context/prompt-analysis-0024.md`.
 */

import type { HomeAssistant } from 'custom-card-helpers';
import type { ColorTuple, ColorEntry } from '../components/saved-colors-picker.js';
import type { SavedColorsConfig } from '../types/config.js';

// Stefan-2026-05-10 P15.6-r39 (R201): kelvin entries are 4-element
// arrays `[r, g, b, k]` where k is the kelvin value to apply on pick.
// Validation: 4th element must be a number in 1000..10000 range.
const KELVIN_MIN = 1000;
const KELVIN_MAX = 10000;

/**
 * Read the saved-colors palette from the configured source. Returns the
 * decoded ColorTuple[] when the source is valid + non-empty + different
 * from the caller's current palette, otherwise `null` (caller keeps its
 * existing palette). Stefan-2026-05-09 P7.1: helper-source path tolerates
 * missing/unknown/unavailable states silently — the helper may not be
 * loaded yet on initial hass push.
 */
export function readSavedColorsFromSource(
  hass: HomeAssistant | undefined,
  cfg: SavedColorsConfig | undefined,
  current: ColorEntry[],
): ColorEntry[] | null {
  if (!cfg || !cfg.source) return null;
  if (cfg.source === 'static') {
    if (cfg.static && cfg.static.length > 0) {
      const next: ColorEntry[] = cfg.static.map((t) => [t[0], t[1], t[2]] as ColorTuple);
      return savedColorsDiffer(next, current) ? next : null;
    }
    return null;
  }
  if (typeof cfg.source === 'string' && cfg.source.startsWith('helper:')) {
    const helperId = cfg.source.substring('helper:'.length);
    const raw = hass?.states[helperId]?.state;
    if (!raw || raw === 'unknown' || raw === 'unavailable') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const valid: ColorEntry[] = [];
      for (const t of parsed) {
        if (!Array.isArray(t)) continue;
        const rgbValid =
          t.length >= 3 &&
          typeof t[0] === 'number' && t[0] >= 0 && t[0] <= 255 &&
          typeof t[1] === 'number' && t[1] >= 0 && t[1] <= 255 &&
          typeof t[2] === 'number' && t[2] >= 0 && t[2] <= 255;
        if (!rgbValid) continue;
        // Stefan-2026-05-10 P15.6-r39 (R201): 4-element entries with a
        // valid kelvin in slot 3 stay 4-element; otherwise truncate to 3.
        if (
          t.length === 4 &&
          typeof t[3] === 'number' &&
          t[3] >= KELVIN_MIN && t[3] <= KELVIN_MAX
        ) {
          valid.push([t[0], t[1], t[2], t[3]] as ColorEntry);
        } else {
          valid.push([t[0], t[1], t[2]] as ColorTuple);
        }
      }
      if (valid.length > 0 && savedColorsDiffer(valid, current)) return valid;
      return null;
    } catch {
      // Invalid JSON in the helper - ignore silently. The user can fix
      // the helper value via Developer Tools / Settings.
      return null;
    }
  }
  // ha_favorites: research pending. Defer.
  return null;
}

/**
 * Persist the saved-colors palette to the configured source. Returns
 * `{ ok: true }` on success, `{ overflow: { length, max } }` when the
 * JSON exceeds the helper's `max` config (caller surfaces a toast),
 * `null` when the source is static / undefined / ha_favorites (no-op).
 *
 * input_text default max is 100; many users will hit this once they
 * save more than ~5-6 colours. The overflow signal lets the caller
 * soft-warn instead of silently truncating.
 */
export function persistSavedColorsToSource(
  hass: HomeAssistant | undefined,
  cfg: SavedColorsConfig | undefined,
  colors: ColorEntry[],
): { ok: true } | { overflow: { helperId: string; length: number; max: number } } | null {
  if (!cfg || typeof cfg.source !== 'string' || !cfg.source.startsWith('helper:')) return null;
  const helperId = cfg.source.substring('helper:'.length);
  const value = JSON.stringify(colors);
  const helper = hass?.states[helperId];
  const helperMax = (helper?.attributes?.max as number | undefined) ?? 100;
  if (value.length > helperMax) {
    return { overflow: { helperId, length: value.length, max: helperMax } };
  }
  void hass?.callService('input_text', 'set_value', {
    entity_id: helperId,
    value,
  });
  return { ok: true };
}

/**
 * Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): HA-user-data namespace.
 * Single top-level key under which all everyday-light-card per-user state
 * lives. Avoids polluting HA's user_data root with one key per entity.
 * Shape stored under this key: `{ saved_colors: { [entity_id]: ColorEntry[] } }`.
 * Additional sub-keys (e.g. `effects_active_order`) can be added later
 * under the same top-level namespace without colliding with anything else.
 */
export const USER_DATA_NAMESPACE = 'everyday_light_card';

interface UserDataShape {
  saved_colors?: Record<string, ColorEntry[]>;
  effects_active_order?: Record<string, string[]>;
}

/**
 * Validate a JSON-decoded ColorEntry[] from any source (helper:input_text
 * or HA user_data). Shared so both readers apply identical rules. Returns
 * the validated subset (drops malformed entries silently).
 */
function validateColorEntries(parsed: unknown): ColorEntry[] {
  if (!Array.isArray(parsed)) return [];
  const valid: ColorEntry[] = [];
  for (const t of parsed) {
    if (!Array.isArray(t)) continue;
    const rgbValid =
      t.length >= 3 &&
      typeof t[0] === 'number' && t[0] >= 0 && t[0] <= 255 &&
      typeof t[1] === 'number' && t[1] >= 0 && t[1] <= 255 &&
      typeof t[2] === 'number' && t[2] >= 0 && t[2] <= 255;
    if (!rgbValid) continue;
    if (
      t.length === 4 &&
      typeof t[3] === 'number' &&
      t[3] >= KELVIN_MIN && t[3] <= KELVIN_MAX
    ) {
      valid.push([t[0], t[1], t[2], t[3]] as ColorEntry);
    } else {
      valid.push([t[0], t[1], t[2]] as ColorTuple);
    }
  }
  return valid;
}

/**
 * Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): async read of the saved-
 * colors palette from HA user_data for a specific entity_id. Used as the
 * default fallback when `saved_colors.source` is unset. Returns null when
 * hass is missing, the WebSocket call fails, or the entity has no stored
 * colors yet. Callers should fire this from a lifecycle hook and update
 * their `_savedColorsState` when the promise resolves.
 */
export async function readSavedColorsFromUserData(
  hass: HomeAssistant | undefined,
  entityId: string,
): Promise<ColorEntry[] | null> {
  if (!hass || !entityId) return null;
  try {
    const r = await hass.callWS<{ value: UserDataShape | null }>({
      type: 'frontend/get_user_data',
      key: USER_DATA_NAMESPACE,
    });
    const all = r?.value?.saved_colors;
    if (!all || !all[entityId]) return null;
    return validateColorEntries(all[entityId]);
  } catch {
    return null;
  }
}

/**
 * Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): async write of the
 * saved-colors palette to HA user_data. Read-merge-write so we don't
 * clobber other entities' palettes or sibling sub-keys
 * (`effects_active_order`, etc.). Fire-and-forget — caller doesn't await
 * the result; failure is silently swallowed (next reload re-reads from
 * source-of-truth so nothing is lost permanently).
 */
export async function persistSavedColorsToUserData(
  hass: HomeAssistant | undefined,
  entityId: string,
  colors: ColorEntry[],
): Promise<{ ok: true } | null> {
  if (!hass || !entityId) return null;
  try {
    const r = await hass.callWS<{ value: UserDataShape | null }>({
      type: 'frontend/get_user_data',
      key: USER_DATA_NAMESPACE,
    });
    const existing: UserDataShape = r?.value ?? {};
    const next: UserDataShape = {
      ...existing,
      saved_colors: {
        ...(existing.saved_colors ?? {}),
        [entityId]: colors,
      },
    };
    await hass.callWS({
      type: 'frontend/set_user_data',
      key: USER_DATA_NAMESPACE,
      value: next,
    });
    return { ok: true };
  } catch {
    return null;
  }
}

/**
 * Cheap structural comparison so callers don't re-set state to the same
 * content (which would re-render and feed back into the lifecycle).
 */
export function savedColorsDiffer(a: ColorEntry[], b: ColorEntry[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2]) return true;
    // Stefan-2026-05-10 P15.6-r39 (R201): also compare 4th-element kelvin
    // when present. Two entries with identical rgb but differing kelvin
    // (or one kelvin / one rgb-only) are different palette slots.
    if (x.length !== y.length) return true;
    if (x.length === 4 && y.length === 4 && x[3] !== y[3]) return true;
  }
  return false;
}
