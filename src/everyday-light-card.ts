/**
 * everyday-light-card - HA Lovelace custom card
 *
 * Phase 2 scaffold (2026-05-07): only registers the element + minimal stub render.
 * Full feature implementation arrives in Phase 3-9 per PHASE-PLAN.md.
 *
 * Card-config schema lives in src/types/config.ts.
 * Components arrive incrementally in src/components/.
 */

import { LitElement, html, css, render, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

import type { EverydayLightCardConfig, GestureAction } from './types/config.js';
import './components/vertical-pill-slider.js';
import './components/mindmap-path.js';
import './components/group-layout-expanded.js';
import './components/effects-list-picker.js';
import './components/color-wheel.js';
import './components/saved-colors-picker.js';
import './components/mode-picker.js';
import { resolveGroup } from './helpers/group-detection.js';
import { PickerController } from './helpers/picker-controller.js';
import { POPUP_PORTAL_STYLES } from './helpers/popup-portal-styles.js';
import { computeIconStateColor } from './helpers/icon-color.js';
import type { ColorTuple, ColorEntry } from './components/saved-colors-picker.js';
import {
  readSavedColorsFromSource,
  persistSavedColorsToSource,
  readSavedColorsFromUserData,
  persistSavedColorsToUserData,
} from './helpers/saved-colors-persistence.js';

/**
 * Default saved-colors palette for parallel-inline (Card 6b). Mirrors
 * the DEFAULT_SAVED_COLORS in group-layout-expanded.ts (kept separate
 * to avoid a cross-component import dependency for an 8-entry constant).
 * Stefan-2026-05-10 R155.
 */
const DEFAULT_PARALLEL_SAVED_COLORS: ColorTuple[] = [
  [248, 141, 42],   // warm orange (brand)
  [255, 250, 234],  // warm white
  [200, 220, 255],  // cool white
  [255, 90, 90],    // red
  [255, 220, 90],   // amber
  [120, 220, 130],  // green
  [120, 180, 250],  // blue
  [200, 100, 220],  // purple
];

const VERSION = '1.0.0';

console.info(
  `%c EVERYDAY-LIGHT-CARD %c v${VERSION} `,
  'color:#fff;background:#5b21b6;font-weight:700;padding:2px 6px;border-radius:3px 0 0 3px',
  'color:#5b21b6;background:#ede9fe;font-weight:700;padding:2px 6px;border-radius:0 3px 3px 0',
);

(window as unknown as { customCards?: unknown[] }).customCards = (window as unknown as { customCards?: unknown[] }).customCards || [];
((window as unknown as { customCards: unknown[] }).customCards).push({
  type: 'everyday-light-card',
  name: 'Everyday Slider',
  description: 'Slider card for lights (brightness/temp/hue/saturation) and media-players (volume). Group-aware with mindmap topology, in-place mode picker, saved-colors edit mode, vertical or horizontal orientation.',
  preview: false,
  documentationURL: 'https://github.com/f17mkx/everyday-light-card',
});

@customElement('everyday-light-card')
export class EverydayLightCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: EverydayLightCardConfig;
  /**
   * Stefan-2026-05-11 R248-R252: reflected `embedded` attribute mirrors
   * `config.embedded`. When set, the host CSS applies flex-end alignment
   * + raised z-index so nested-member cards stack their content at the
   * cell BOTTOM (consistent group-icon Y across all siblings in a row)
   * and aren't intercepted by the outer mindmap SVG. Synced in
   * `setConfig`.
   */
  @property({ type: Boolean, reflect: true }) embedded = false;

  /**
   * Stefan-2026-05-11 P15.6-r63a (R292 / PA-0019): nesting depth, 0-indexed
   * from the outermost card. Top-level cards (e.g. apartment) start at 0;
   * embedded sub-cards inherit `parent.depth + 1`. Plumbed through to
   * `<everyday-group-layout-expanded>` so its `.member-cols` gap scales
   * by depth (28 px → 14 px → 8 px → 4 px). Implements the intra-group <
   * inter-group rule from PA-14 R292: shallower levels (which form
   * inter-group boundaries) get wider gaps, deeper levels (intra-group
   * siblings) get tighter ones.
   */
  @property({ type: Number, reflect: true }) depth = 0;

  // Stefan-2026-05-09 P38.1: effects-list-picker state. activeOrder is the
  // user's preferred ordering of effects (subset of light.effect_list).
  // Items in effect_list but not in activeOrder render in the grayed-out
  // "deleted" section.
  // P12 (2026-05-09): persistence via `effects_picker.source: helper:input_text.<id>`
  // — JSON payload `{activeOrder: [string, ...]}` in the helper's `state`.
  // Read on every hass push; written on each delete/restore. Without the
  // config, behaves as MVP (in-memory only).
  @state() private _effectsActiveOrder: string[] = [];
  @state() private _effectsEditMode = false;
  // Cache of the last-read helper-state to avoid feedback re-render loops.
  private _effectsLastHelperRaw?: string;

  // Stefan-2026-05-10 P15.6-r28: effects-list popup for parallel-inline
  // double-tap action `effects_list`. When open, renders the
  // effects-list-picker as a centered modal in the body-portal so it
  // escapes HA's transform-ancestor (same pattern as wheel/saved). Closes
  // on pick or backdrop tap. Phantom-click suppression mirrors PickerController:
  // `_effectsPopupOpenedAt` blocks backdrop-close for 300 ms after open.
  @state() private _effectsPopupOpen = false;
  private _effectsPopupOpenedAt = 0;

  // Stefan-2026-05-09 P14c: picker + wheel + saved-colors popup
  // machinery extracted to a Lit Reactive Controller. Same controller
  // can be used by group-layout-expanded.ts in P14c.2 to dedupe the
  // duplicate state/handlers there. The controller owns long-press +
  // press-drag-select gesture, popup-render templates, outside-click,
  // and service-call routing.
  // Stefan-2026-05-10 P15.6-r46 (R223): mutable saved-colors palette for
  // edit-mode in the parallel-inline picker. Initialized lazily on first
  // hass-pull (or first edit). Mirrors `_savedColors` in
  // group-layout-expanded.ts. ColorEntry can be 3-tuple (rgb) or 4-tuple
  // (rgb + kelvin); R201 round-tripping via 4-tuple keeps temp-mode
  // saves landing at exact kelvin.
  @state() private _savedColorsState: ColorEntry[] | null = null;

  // Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): edit-mode for the standalone
  // 'saved-colors' display-mode tile. Toggled by long-press inside the
  // picker (enter-edit), reset by tapping ✓ (done-editing). Independent of
  // any popup edit state used by group-layout-expanded.
  @state() private _displayModeSavedEditing = false;

  private _picker = new PickerController(this, {
    // Stefan-2026-05-10 P15.6-r46 (R221 + R222): variant `parallel-inline`
    // replaces `group-expanded` here. Picker now shows only saved/wheel
    // (+ effects when entity has effect_list) — drops 'cycle' (every mode
    // already visible) and 'parallel' (already in parallel mode, popup
    // of same modes redundant). Stefan-Quote: "main cozy (4 axis) mode
    // picker contains the 'cycle' icon which makes no sense ... contains
    // the 'pop up slider' icon / option which also makes no sense".
    variant: 'parallel-inline',
    longPressMs: 200,
    hassProvider: () => this.hass,
    entityIdProvider: () => this.config?.entity,
    colorWheelConfigProvider: () => this.config?.color_wheel,
    savedColorsConfigProvider: () => this.config?.saved_colors,
    // Stefan-2026-05-10 R155: provide saved-colors palette to the
    // controller's renderSaved popup. Reads from cfg.saved_colors.static
    // when set; falls back to the same default palette
    // group-layout-expanded uses for consistency across all card types.
    // Stefan-2026-05-10 P15.6-r46 (R223): when edit-mode has mutated the
    // palette, return the mutable state instead of the static config so
    // long-press → delete → tap-restore round-trips correctly.
    savedColorsProvider: () => {
      if (this._savedColorsState) return this._savedColorsState as ColorTuple[];
      const cfg = this.config?.saved_colors;
      if (cfg?.static && Array.isArray(cfg.static) && cfg.static.length > 0) {
        return cfg.static;
      }
      return DEFAULT_PARALLEL_SAVED_COLORS;
    },
    onDoubleTap: () => this._handleDoubleTap(),
    // Stefan-2026-05-10 P15.6-r46 (R224): forward the effects picker mode
    // to the host's existing `_effectsPopupOpen` state. Reuses the body-
    // portal popup that was already rendered for the `effects_list`
    // double-tap action — DRY, no second portal.
    onEffectsPick: () => {
      this._effectsPopupOpen = true;
      this._effectsPopupOpenedAt = Date.now();
    },
    // Stefan-2026-05-10 P15.6-r46 (R223): saved-colors edit-mode handlers
    // delegated back to the host because the host owns the persistence
    // surface (helper:input_text via persistSavedColorsToSource).
    onSavedAddCurrent: () => this._onSavedAddCurrent(),
    onSavedRemove: (idx) => this._onSavedRemove(idx),
  });

  /**
   * Stefan-2026-05-10 R134: configurable double-tap action for the
   * parallel-inline picker icon. Reads `gestures.member_icon.double_tap`
   * from the card config (or the legacy `gestures.group_icon.double_tap`
   * if the entity is a group). Default: `'color_wheel'` — opens the wheel
   * popup directly. Set to `'none'` to disable double-tap entirely. The
   * supported actions are mapped to the controller's existing wheel/saved
   * state machinery; `cycle_mode` is a no-op here (parallel-inline already
   * shows every mode side-by-side, nothing to cycle).
   */
  private _handleDoubleTap(): void {
    const cfg = this.config;
    if (!cfg || !this.hass) return;
    // Stefan-2026-05-10 P15.6-r35 (R195): default double-tap action is now
    // 'cycle_mode' (was 'color_wheel'). Cycle is meaningful for tile
    // contexts where ONE slider is visible (a future single-light path).
    // In parallel-inline (Cards 2/3/6b) every mode is already visible
    // side-by-side so cycle_mode is a no-op here — users wanting wheel/
    // saved on parallel-inline double-tap can configure explicitly.
    const action: GestureAction =
      cfg.gestures?.member_icon?.double_tap
      ?? cfg.gestures?.group_icon?.double_tap
      ?? 'cycle_mode';
    if (action === 'none') return;
    if (action === 'toggle' || action === 'toggle_with_restore') {
      void this.hass.callService('light', 'toggle', { entity_id: cfg.entity });
      return;
    }
    if (action === 'color_wheel') {
      this._picker.openWheel();
      return;
    }
    if (action === 'saved_colors') {
      this._picker.openSaved();
      return;
    }
    if (action === 'effects_list') {
      // Stefan-2026-05-10 P15.6-r28: open effects-list-picker as a
      // centered popup in the body-portal. Only meaningful for entities
      // with a non-empty effect_list attribute; the render-method silently
      // returns null otherwise so the user just sees no popup (and can
      // re-config to a different action).
      this._effectsPopupOpen = true;
      this._effectsPopupOpenedAt = Date.now();
      return;
    }
    if (action === 'classic_more_info') {
      // Standard HA more-info dialog (covers effects + every other entity
      // attribute). Cleaner than a custom popup for users who want full
      // entity control on double-tap.
      const event = new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId: cfg.entity },
      });
      this.dispatchEvent(event);
      return;
    }
    // 'cycle_mode' / 'mode_picker' / 'expand_overlay' / 'expand_inline':
    // no-op in parallel-inline. cycle_mode doesn't apply (every mode is
    // already visible side-by-side); the others would require leaving
    // parallel-mode entirely, which conflicts with default_view_mode.
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // Phase 9 deliverable: visual editor (R8 runtime gesture rotation)
    await import('./editor/everyday-light-card-editor.js');
    return document.createElement('everyday-light-card-editor') as unknown as LovelaceCardEditor;
  }

  public static getStubConfig(): Partial<EverydayLightCardConfig> {
    return {
      type: 'custom:everyday-light-card',
      entity: 'light.example',
    };
  }

  public setConfig(config: EverydayLightCardConfig): void {
    // Stefan-2026-05-12 P15.6-r63l (R318 / PA-0043): allow `entity: 'none'`
    // OR omit entity entirely when `group.manual_members` is present. This
    // turns the card into a CONTAINER for compound layouts (Stefan-Quote:
    // "I want to have a slider config in 1 config, where the main lights
    // are to the left and to the right there is one slider to adjust the
    // color temp for all lights"). The container has no entity-level state
    // — toggle is a no-op, RGB/brightness inline-style is empty. Members
    // each render via their own full config (R208 ManualMember).
    const isContainer = (!config?.entity || config.entity === 'none')
      && Array.isArray(config?.group?.manual_members)
      && config.group.manual_members.length > 0;
    if (!isContainer && !config?.entity) {
      throw new Error('everyday-light-card: `entity` is required (a light.* entity_id) — OR set `entity: none` with `group.manual_members` for compound cards.');
    }
    this.config = config;
    // Stefan-2026-05-11 R248-R252: sync the reflected attribute so the
    // :host([embedded]) CSS rule kicks in for nested-member cards.
    this.embedded = config.embedded === true;
  }

  // ============================================================
  // Saved-colors edit-mode handlers (P15.6-r46 R223)
  // ============================================================
  /**
   * Stefan-2026-05-10 P15.6-r46 (R223): seed `_savedColorsState` from
   * the configured source on first call. Mirrors group-layout-expanded's
   * `_syncSavedColorsFromSource`. After seeding, the controller's
   * `savedColorsProvider` returns the mutable state instead of cfg.static
   * so edits round-trip correctly.
   */
  private _ensureSavedColorsState(): void {
    if (this._savedColorsState) return;
    // Seed from helper:input_text source if configured.
    const fromSource = readSavedColorsFromSource(
      this.hass,
      this.config?.saved_colors,
      [],
    );
    if (fromSource) {
      this._savedColorsState = fromSource;
      return;
    }
    // Otherwise from cfg.static (3-tuples only at the YAML schema today).
    const staticPalette = this.config?.saved_colors?.static;
    if (Array.isArray(staticPalette) && staticPalette.length > 0) {
      this._savedColorsState = staticPalette.map(
        (t) => [t[0], t[1], t[2]] as ColorTuple,
      );
      return;
    }
    // Fall back to the brand default palette.
    this._savedColorsState = DEFAULT_PARALLEL_SAVED_COLORS.map(
      (t) => [t[0], t[1], t[2]] as ColorTuple,
    );
    // Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): when no source is
    // configured, also fire an async read from HA user_data — this is the
    // common case (most users won't set `saved_colors.source`). If the user
    // has previously saved colors via this card, they'll appear once the
    // WebSocket promise resolves, replacing the brand default seeded above.
    // Fire-and-forget; we don't block first-paint on the WS round-trip.
    if (!this.config?.saved_colors?.source) {
      const entityId = this.config?.entity;
      if (entityId) {
        void readSavedColorsFromUserData(this.hass, entityId).then((fromUd) => {
          if (fromUd && fromUd.length > 0) {
            this._savedColorsState = fromUd;
            this.requestUpdate();
          }
        });
      }
    }
  }

  private _onSavedAddCurrent(): void {
    if (!this.hass || !this.config) return;
    this._ensureSavedColorsState();
    const target = this.config.entity;
    const s = this.hass.states[target];
    const rgb = s?.attributes?.rgb_color as
      | [number, number, number]
      | undefined;
    if (!rgb || rgb.length !== 3) return;
    // Stefan-2026-05-10 P15.6-r45 (R201): same temp-mode detection as
    // group-layout-expanded._onSavedAddCurrent — accept either a host-
    // toggled mode flag (not applicable here, parallel-inline shows all
    // modes side-by-side) OR the entity's HA-reported `color_mode`.
    // Stefan-2026-05-11 R281 (PA-14): some Hue / Zigbee bulbs report
    // `color_mode: unknown` or stale `color_mode: rgb`-style values when
    // the user just set a CT value — even though they're effectively in
    // CT mode. The `color_temp_kelvin` attribute is the ground-truth
    // signal in that case. We only fall back to it when `color_mode` is
    // NOT explicitly one of the well-known color modes (hs/rgb/xy etc.) —
    // if the lamp says definitively "I'm in HS", we trust that and save
    // as rgb. Otherwise (unknown/missing/legacy), a positive kelvin attr
    // is enough to trigger the temp-save path.
    const colorMode = s?.attributes?.color_mode as string | undefined;
    const kelvin = s?.attributes?.color_temp_kelvin as number | undefined;
    const isExplicitColorMode =
      colorMode === 'hs'
      || colorMode === 'rgb'
      || colorMode === 'rgbw'
      || colorMode === 'rgbww'
      || colorMode === 'xy';
    const isTempMode =
      colorMode === 'color_temp'
      || (!isExplicitColorMode && typeof kelvin === 'number' && kelvin > 0);
    const newEntry: ColorEntry =
      isTempMode && typeof kelvin === 'number' && kelvin > 0
        ? [rgb[0], rgb[1], rgb[2], kelvin]
        : [rgb[0], rgb[1], rgb[2]];
    // Dedupe by rgb (within 5/255) AND, when present, kelvin (within 50K).
    const dup = this._savedColorsState!.find((c) => {
      const rgbMatch =
        Math.abs(c[0] - newEntry[0]) < 5 &&
        Math.abs(c[1] - newEntry[1]) < 5 &&
        Math.abs(c[2] - newEntry[2]) < 5;
      if (!rgbMatch) return false;
      const newK = newEntry.length === 4 ? newEntry[3] : undefined;
      const oldK = c.length === 4 ? c[3] : undefined;
      if (newK === undefined && oldK === undefined) return true;
      if (newK !== undefined && oldK !== undefined)
        return Math.abs(newK - oldK) < 50;
      return false;
    });
    if (dup) return;
    this._savedColorsState = [...this._savedColorsState!, newEntry];
    persistSavedColorsToSource(
      this.hass,
      this.config.saved_colors,
      this._savedColorsState,
    );
    // Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): when no helper
    // source is configured, persist to HA user_data so the save survives
    // hard-refresh. Fire-and-forget; the local _savedColorsState is the
    // immediate source of truth for the current session anyway.
    if (!this.config.saved_colors?.source) {
      void persistSavedColorsToUserData(
        this.hass,
        this.config.entity,
        this._savedColorsState,
      );
    }
  }

  private _onSavedRemove(idx: number): void {
    this._ensureSavedColorsState();
    if (idx < 0 || idx >= this._savedColorsState!.length) return;
    this._savedColorsState = [
      ...this._savedColorsState!.slice(0, idx),
      ...this._savedColorsState!.slice(idx + 1),
    ];
    persistSavedColorsToSource(
      this.hass,
      this.config?.saved_colors,
      this._savedColorsState,
    );
    // Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): mirror the
    // user_data persist for removes so a hard-refresh after a delete
    // doesn't restore the deleted entry.
    if (!this.config?.saved_colors?.source && this.config?.entity) {
      void persistSavedColorsToUserData(
        this.hass,
        this.config.entity,
        this._savedColorsState,
      );
    }
  }

  // ============================================================
  // Display-mode handlers — color-wheel / saved-colors standalone
  // (Stefan-2026-05-12 P15.6-r64 / PA-0014 R3). The card body becomes a
  // dedicated picker tile when `default_view_mode` is set to one of
  // 'color-wheel' / 'saved-colors'. Pattern mirrors effects-picker below:
  // no slider, no icon, no mindmap. The picker emits `color-pick` with
  // `{ r, g, b }` and the host fires `light.turn_on` with rgb_color.
  // ============================================================
  private _onDisplayModeColorPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    if (!this.hass || !this.config) return;
    const r = ev.detail?.r;
    const g = ev.detail?.g;
    const b = ev.detail?.b;
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') return;
    void this.hass.callService('light', 'turn_on', {
      entity_id: this.config.entity,
      rgb_color: [r, g, b],
    });
  };

  private _onDisplayModeSavedPick = (ev: CustomEvent): void => {
    // saved-colors-picker dispatches `{ r, g, b }` on tap. Reuse the same
    // service-call path as the wheel above so behaviour is identical.
    this._onDisplayModeColorPick(ev);
  };

  // ============================================================
  // Effects-picker handlers (P38.1 — Stefan-2026-05-09)
  // ============================================================
  private _onEffectPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    if (!this.hass || !this.config) return;
    const effect = ev.detail?.effect as string | undefined;
    if (!effect) return;
    void this.hass.callService('light', 'turn_on', {
      entity_id: this.config.entity,
      effect,
    });
  };

  private _onEffectDelete = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const effect = ev.detail?.effect as string | undefined;
    if (!effect || !this.hass || !this.config) return;
    const stateObj = this.hass.states[this.config.entity];
    const fullList = (stateObj?.attributes?.effect_list as string[] | undefined) ?? [];
    const current = this._effectsActiveOrder.length > 0
      ? this._effectsActiveOrder
      : fullList;
    this._effectsActiveOrder = current.filter((e) => e !== effect);
    this._persistEffectsActiveToSource();
  };

  private _onEffectRestore = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const effect = ev.detail?.effect as string | undefined;
    if (!effect || !this.hass || !this.config) return;
    const stateObj = this.hass.states[this.config.entity];
    const fullList = (stateObj?.attributes?.effect_list as string[] | undefined) ?? [];
    const current = this._effectsActiveOrder.length > 0
      ? this._effectsActiveOrder
      : fullList;
    if (current.includes(effect)) return;
    this._effectsActiveOrder = [...current, effect];
    this._persistEffectsActiveToSource();
  };

  private _onEffectsEnterEdit = (ev: CustomEvent): void => {
    ev.stopPropagation();
    this._effectsEditMode = true;
  };

  private _onEffectsExitEdit = (ev?: CustomEvent): void => {
    ev?.stopPropagation();
    this._effectsEditMode = false;
  };

  /**
   * Stefan-2026-05-09 P12 effects-persistence: read activeOrder from the
   * configured helper source on every hass push. JSON payload format:
   * `{ "activeOrder": ["effect1", "effect2", ...] }`. Falls back to
   * in-memory state when no source is configured. Mirrors the saved-
   * colors pattern at group-layout-expanded#_syncSavedColorsFromSource.
   */
  private _syncEffectsActiveFromSource(): void {
    const cfg = this.config?.effects_picker;
    if (!cfg?.source) return;
    if (typeof cfg.source !== 'string' || !cfg.source.startsWith('helper:')) return;
    const helperId = cfg.source.substring('helper:'.length);
    const raw = this.hass?.states[helperId]?.state;
    if (!raw || raw === 'unknown' || raw === 'unavailable') return;
    if (raw === this._effectsLastHelperRaw) return;
    this._effectsLastHelperRaw = raw;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return;
      const candidate = (parsed as { activeOrder?: unknown }).activeOrder;
      if (!Array.isArray(candidate)) return;
      const valid = candidate.filter((e): e is string => typeof e === 'string');
      this._effectsActiveOrder = valid;
    } catch {
      // Invalid JSON in the helper - silent ignore. Fix via Settings.
    }
  }

  private _persistEffectsActiveToSource(): void {
    const cfg = this.config?.effects_picker;
    if (!cfg?.source) return;
    if (typeof cfg.source !== 'string' || !cfg.source.startsWith('helper:')) return;
    const helperId = cfg.source.substring('helper:'.length);
    const value = JSON.stringify({ activeOrder: this._effectsActiveOrder });
    const helper = this.hass?.states[helperId];
    const helperMax = (helper?.attributes?.max as number | undefined) ?? 100;
    if (value.length > helperMax) {
      console.warn(
        `[everyday-light-card] effects activeOrder (${value.length} chars) exceeds ${helperId} max (${helperMax}). Bump the helper's max attribute.`,
      );
      return;
    }
    // Cache so the subsequent hass-push read doesn't reset our state.
    this._effectsLastHelperRaw = value;
    void this.hass?.callService('input_text', 'set_value', {
      entity_id: helperId,
      value,
    });
  }

  /**
   * Stefan-2026-05-10 R148+R157: body-portal node for wheel + saved-colors
   * popups. Uses the SHARED `everyday-popup-portal` class + POPUP_PORTAL_STYLES
   * so parallel-inline (Card 6b) gets the exact same `.inplace-popup wheel`
   * and `.inplace-popup saved` styling as the body-portal popups in
   * group-layout-expanded.ts (Cards 2/3/6a). Stefan's "1 implementation
   * für alle" directive — every picker-popup site goes through one styled
   * surface.
   */
  private _pickerPortal: HTMLDivElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._pickerPortal) {
      this._pickerPortal = document.createElement('div');
      this._pickerPortal.className = 'everyday-popup-portal';
      document.body.appendChild(this._pickerPortal);
    }
    // Inject shared styles ONCE per document. Both this card and the
    // group-layout-expanded element try to inject; the id-check prevents
    // duplicates.
    if (!document.getElementById('everyday-popup-portal-styles')) {
      const style = document.createElement('style');
      style.id = 'everyday-popup-portal-styles';
      style.textContent = POPUP_PORTAL_STYLES;
      document.head.appendChild(style);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pickerPortal) {
      render(html``, this._pickerPortal);
      this._pickerPortal.remove();
      this._pickerPortal = null;
    }
  }

  protected updated(): void {
    // Sync from helper-source on every hass push so external mutations
    // are reflected. No-op when no source is configured.
    this._syncEffectsActiveFromSource();
    // Stefan-2026-05-09 P14c: re-bind picker gestures on every render.
    // Controller is idempotent (tears down old binding before re-binding).
    // Stefan-2026-05-11 R289 (PA-14): bind `.single-icon` when configured.
    // Stefan-2026-05-12 P15.6-r63j (R312 / PA-0040): R289's `gestures.
    // member_icon` GATE DROPPED. Bind whichever icon exists in the rendered
    // DOM — `.parallel-mindmap-icon` for parallel-inline path,
    // `.single-icon` for bare single-light path. Pre-r63j the bare single-
    // light (just `entity: light.X`, no gestures, no group, no parallel)
    // had an inert icon. Stefan-Quote PA-0039 Req 5: "The defaults must
    // work! (on/off, Press-drag-select gesture, doppeltip cycle". Defaults
    // from picker-controller: tap → light.toggle (line 280-285), long-press
    // → picker ring, double-tap → `_handleDoubleTap` (cycle_mode default).
    // The group + horizontal-pill render paths don't have either selector,
    // so bindIcon(null) cleanly tears down any prior binding.
    const parallelIcon = this.renderRoot.querySelector('.parallel-mindmap-icon') as HTMLElement | null;
    const singleIcon = this.renderRoot.querySelector('.single-icon') as HTMLElement | null;
    // Stefan-2026-05-12 R327 (PA-0008): bind to the compact parallel-icon when
    // `parallel_sliders.layout: compact` is in effect. Selector order tries
    // each variant; the first match wins. bindIcon is idempotent so the
    // double-query is cheap.
    const parallelCompactIcon = this.renderRoot.querySelector('.parallel-compact-icon') as HTMLElement | null;
    this._picker.bindIcon(parallelIcon ?? parallelCompactIcon ?? singleIcon);
    // Stefan-2026-05-10 R148: render the picker's wheel + saved popups
    // into the body-portal so they escape HA's transform-ancestor (which
    // would otherwise break position:fixed). The PickerController's
    // renderWheel/renderSaved return null when popups are closed, so an
    // empty render call cleans the portal naturally.
    if (this._pickerPortal) {
      render(
        html`${this._picker.renderWheel()}${this._picker.renderSaved()}${this._renderEffectsPopup()}`,
        this._pickerPortal,
      );
    }
  }

  /**
   * Stefan-2026-05-10 P15.6-r28: render the effects-list-picker popup when
   * triggered via parallel-inline double-tap → effects_list action. Returns
   * null when closed or when the entity has no effect_list. Backdrop tap
   * closes the popup; effect-pick fires the same handler as the standalone
   * effects-picker view-mode (calls light.turn_on with effect=...) and then
   * auto-closes. Phantom-click suppression: backdrop ignores taps within
   * 300 ms of the open-time so the same tap that opened the popup doesn't
   * immediately close it. Edit-mode is intentionally disabled here — this
   * popup is a quick-pick surface, not a list-management surface.
   */
  private _renderEffectsPopup(): TemplateResult | null {
    if (!this._effectsPopupOpen || !this.hass || !this.config) return null;
    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) return null;
    const effectList = (stateObj.attributes.effect_list as string[] | undefined) ?? [];
    if (effectList.length === 0) {
      // No effects available — silently no-op the popup so a misconfigured
      // double-tap on a non-effect light doesn't render an empty surface.
      this._effectsPopupOpen = false;
      return null;
    }
    const close = (): void => {
      this._effectsPopupOpen = false;
      this.requestUpdate();
    };
    const onBackdropTap = (ev: Event): void => {
      ev.stopPropagation();
      if (Date.now() - this._effectsPopupOpenedAt < 300) return;
      close();
    };
    return html`
      <div
        class="effects-popup-backdrop"
        style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 199; pointer-events: auto;"
        @click=${onBackdropTap}
      >
        <div
          class="inplace-popup effects"
          style="left: 50%; top: 50%; width: min(360px, 90vw); max-height: min(70vh, 540px); padding: 18px; overflow: auto;"
          @click=${(ev: Event) => ev.stopPropagation()}
        >
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 500; color: var(--primary-text-color, #fff);">Effects</div>
            <button
              class="popup-close"
              style="width:28px; height:28px; border-radius:50%; border:none; background:rgba(255,255,255,0.08); color:var(--primary-text-color,#fff); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;"
              @click=${close}
            >×</button>
          </div>
          <everyday-effects-list-picker
            .effects=${effectList}
            .activeOrder=${this._effectsActiveOrder}
            .editMode=${false}
            .longPressMs=${200}
            @effect-pick=${(ev: CustomEvent) => {
              this._onEffectPick(ev);
              close();
            }}
          ></everyday-effects-list-picker>
        </div>
      </div>
    `;
  }

  public getCardSize(): number {
    // Group-expanded layout is roughly 1.5× the height of the single-light view.
    if (this.hass && this.config) {
      const grp = resolveGroup(this.hass, this.config.entity, this.config.group?.manual_members);
      if (grp) return 6;
    }
    return 4;
  }

  /**
   * Stefan-2026-05-12 P15.6-r63l (R318 / PA-0043): container card render.
   * Used when `entity: 'none'` (or omitted) AND `group.manual_members` is
   * populated. The card has no entity-level state — it's a layout shell
   * for embedded sub-cards. Renders directly as an
   * `<everyday-group-layout-expanded>` with the manual_members as the
   * member list, no group-entity for picker actions (parent_node implicitly
   * 'hide' unless the user explicitly says 'show'). Each member uses its
   * own full card-config (R208 ManualMember).
   */
  private _renderContainerCard(): TemplateResult {
    const cfg = this.config!;
    const groupCfg = cfg.group ?? {};
    const members = groupCfg.manual_members ?? [];
    // Build memberConfigs Map (entity → Partial<Config>) from manual_members
    // structured form. Bare strings have no overrides (empty Partial).
    const memberConfigs = new Map<string, Partial<EverydayLightCardConfig>>();
    const memberIds: string[] = [];
    for (const m of members) {
      if (typeof m === 'string') {
        memberIds.push(m);
      } else if (m && typeof m === 'object' && m.entity) {
        memberIds.push(m.entity);
        memberConfigs.set(m.entity, m);
      }
    }
    // Container-cards default to parent_node: hide (no entity to control).
    // User can override to 'show' to render a generic parent-row.
    const hideParent = cfg.parent_node !== 'show';
    const showIcons = cfg.show_icons !== false;
    const showMindmap = cfg.show_mindmap !== false;
    const groupContent = html`
      <everyday-group-layout-expanded
        .hass=${this.hass}
        group-entity=${''}
        .memberIds=${memberIds}
        .memberConfigs=${memberConfigs}
        .groupName=${cfg.name ?? ''}
        .groupIconName=${cfg.icon}
        .longPressMs=${cfg.gestures?.long_press_ms ?? 200}
        .memberTap=${'toggle'}
        .groupDoubleTapAction=${cfg.gestures?.group_icon?.double_tap}
        .wheelType=${cfg.color_wheel?.type === 'smooth' ? 'smooth' : 'stepped'}
        .wheelHues=${cfg.color_wheel?.hue_segments ?? 21}
        .wheelRings=${cfg.color_wheel?.saturation_rings ?? 6}
        .sliderWidth=${cfg.slider?.width}
        .sliderHeight=${cfg.slider?.height}
        .compact=${false}
        .wheelPersistent=${cfg.color_wheel?.persistent !== false}
        .savedPersistent=${cfg.saved_colors?.persistent !== false}
        .persistentSliderMode=${cfg.slider?.persistent_mode === true}
        .iconPosition=${groupCfg.icon_position === 'top' ? 'top' : 'bottom'}
        .mindmapDots=${typeof groupCfg.mindmap_dots === 'boolean' ? groupCfg.mindmap_dots : false}
        .savedColorsConfig=${cfg.saved_colors}
        .parallelSlidersConfig=${cfg.parallel_sliders}
        .fullLengthSliders=${groupCfg.full_length_sliders === true}
        .expansionMode=${groupCfg.expansion_mode ?? 'inline'}
        .expandInPlace=${groupCfg.expand_in_place === true}
        .iconColor=${cfg.icon_color}
        .cycleModes=${cfg.cycle?.modes}
        .effectsEditable=${cfg.effects_picker?.editable !== false}
        .embedded=${cfg.embedded === true}
        .depth=${this.depth}
        .hideParent=${hideParent}
        .showIcons=${showIcons}
        .showMindmap=${showMindmap}
      ></everyday-group-layout-expanded>
    `;
    if (cfg.embedded === true) return groupContent;
    return html`<ha-card>${groupContent}</ha-card>`;
  }

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html`<ha-card><div class="placeholder">everyday-light-card loading...</div></ha-card>`;
    }
    // Stefan-2026-05-12 P15.6-r63l (R318 / PA-0043): container-card path.
    // When `entity: 'none'` (or omitted) AND `group.manual_members` is
    // populated, render directly as an expanded-group of the configured
    // members — no entity-level state, no toggle. Skips entity validation
    // + the parallel/single-light branches below.
    const isContainer = (!this.config.entity || this.config.entity === 'none')
      && Array.isArray(this.config.group?.manual_members)
      && this.config.group!.manual_members!.length > 0;
    if (isContainer) {
      return this._renderContainerCard();
    }
    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`<ha-card><div class="placeholder error">Entity ${this.config.entity} not found.</div></ha-card>`;
    }
    // Stefan-2026-05-09: card now supports light.* AND media_player.*. Other
    // domains warn at render time. Group features still apply only to lights.
    const domain = this.config.entity.split('.')[0];
    if (domain !== 'light' && domain !== 'media_player') {
      return html`<ha-card><div class="placeholder error">
        Entity must be a <code>light.*</code> or <code>media_player.*</code> entity (got <code>${this.config.entity}</code>).
      </div></ha-card>`;
    }

    // Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): color-wheel render-mode.
    // The card becomes a standalone color-wheel tile — no slider, no icon,
    // no mindmap. Wheel geometry from `color_wheel.*` config (defaults
    // 8 rings × 24 hues stepped). Tap → light.turn_on with rgb_color.
    if (this.config.default_view_mode === 'color-wheel' && domain === 'light') {
      const wheelType = this.config.color_wheel?.type === 'smooth' ? 'smooth' : 'stepped';
      const hues = this.config.color_wheel?.hue_segments ?? 24;
      const rings = this.config.color_wheel?.saturation_rings ?? 8;
      const labelTitle = this.config.name
        ?? (stateObj.attributes.friendly_name as string | undefined)
        ?? this.config.entity;
      return html`
        <ha-card>
          <div class="display-mode-card">
            <div class="display-mode-title">${labelTitle}</div>
            <div class="display-mode-wheel-wrap">
              <everyday-color-wheel
                wheel-type=${wheelType}
                hues=${hues}
                rings=${rings}
                @color-pick=${this._onDisplayModeColorPick}
              ></everyday-color-wheel>
            </div>
          </div>
        </ha-card>
      `;
    }

    // Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): saved-colors render-mode.
    // The card becomes a standalone saved-colors-picker tile — no slider,
    // no icon, no mindmap. Palette + persistence reuse the existing
    // _savedColorsState path (lazy-seeded on first render, persisted via
    // helper:input_text or HA user_data when no source is configured).
    // Edit-mode (long-press → wiggle + −/+ ✓) is per-card local state.
    if (this.config.default_view_mode === 'saved-colors' && domain === 'light') {
      this._ensureSavedColorsState();
      const labelTitle = this.config.name
        ?? (stateObj.attributes.friendly_name as string | undefined)
        ?? this.config.entity;
      return html`
        <ha-card>
          <div class="display-mode-card">
            <div class="display-mode-title">
              ${labelTitle}${this._displayModeSavedEditing ? ' · edit' : ''}
            </div>
            <everyday-saved-colors-picker
              .colors=${this._savedColorsState ?? []}
              .editMode=${this._displayModeSavedEditing}
              @color-pick=${this._onDisplayModeSavedPick}
              @add-current=${() => this._onSavedAddCurrent()}
              @remove-color=${(ev: CustomEvent) => {
                const idx = ev.detail?.index as number | undefined;
                if (typeof idx === 'number') this._onSavedRemove(idx);
              }}
              @enter-edit=${() => { this._displayModeSavedEditing = true; }}
              @done-editing=${() => { this._displayModeSavedEditing = false; }}
            ></everyday-saved-colors-picker>
          </div>
        </ha-card>
      `;
    }

    // Stefan-2026-05-09 P38.1: effects-picker render-mode. The card becomes
    // a standalone effects-list-picker tile — no slider, no icon. Effects
    // are sourced from `light.attributes.effect_list`. State (active vs
    // grayed-out ordering) lives in @state for MVP; persistence comes
    // later (P38.2).
    if (this.config.default_view_mode === 'effects-picker' && domain === 'light') {
      const effectList = (stateObj.attributes.effect_list as string[] | undefined) ?? [];
      const labelTitle = this.config.name
        ?? (stateObj.attributes.friendly_name as string | undefined)
        ?? this.config.entity;
      return html`
        <ha-card>
          <div class="effects-card">
            <div class="effects-title">${labelTitle}${this._effectsEditMode ? ' · edit' : ''}</div>
            <everyday-effects-list-picker
              .effects=${effectList}
              .activeOrder=${this._effectsActiveOrder}
              .editMode=${this._effectsEditMode}
              .editable=${this.config.effects_picker?.editable !== false}
              .longPressMs=${this.config.gestures?.long_press_ms ?? 200}
              @effect-pick=${this._onEffectPick}
              @delete-effect=${this._onEffectDelete}
              @restore-effect=${this._onEffectRestore}
              @enter-edit=${this._onEffectsEnterEdit}
              @exit-edit=${this._onEffectsExitEdit}
            ></everyday-effects-list-picker>
          </div>
        </ha-card>
      `;
    }

    // Stefan-2026-05-09 P47-fix R50: default_view_mode='parallel' takes
    // priority over group-detection. When the user opts into the parallel
    // render-mode, render N parallel sliders for the entity itself —
    // whether or not it's a group. Applied service calls (light.turn_on
    // etc.) on a group propagate to all members, so the parallel sliders
    // work for both single-entity AND group entities.
    //
    // Stefan-2026-05-12 P15.6-r63l (R314 / PA-0043): when `modes` has
    // exactly 1 entry, the parallel-inline shell (mindmap-bg + N>1 slider
    // row) is degenerate — same visual as a bare single-light card with
    // the slider in that one mode. Stefan-Quote: "this config should look
    // exactly like this config (except that the slider is the temp slider
    // of course". Best-guess interpretation: 1-mode parallel SHOULD render
    // visually identical to bare single-light. We override `cfg.mode` with
    // the configured single mode and fall through to the single-light
    // render path below (no parallel-mindmap-layout shell).
    if (
      this.config.default_view_mode === 'parallel'
      && domain === 'light'
      && this.config.parallel_sliders?.modes?.length === 1
    ) {
      // Fall through — single-light path below renders with this mode.
      // No early-return; `mode` resolution lower picks up the override.
    } else if (this.config.default_view_mode === 'parallel' && domain === 'light') {
      const cfg = this.config;
      // Stefan-2026-05-12 R332 (PA-0012): `parallel_sliders.layout: compact`
      // means "brightness slider only". The configured `modes:` array is
      // intentionally ignored when layout is compact — Stefan-Quote: "parallel_sliders:
      // layout: compact should mean that in compact view only the brightness
      // slider is shown". Expanded keeps the full multi-axis stack.
      const parallelLayoutIsCompact = cfg.parallel_sliders?.layout === 'compact';
      const modes = parallelLayoutIsCompact
        ? (['brightness'] as Array<'brightness' | 'temperature' | 'hue' | 'saturation'>)
        : ((cfg.parallel_sliders?.modes
          ?? ['brightness', 'temperature', 'hue', 'saturation']) as Array<
            'brightness' | 'temperature' | 'hue' | 'saturation'
          >);
      // Stefan-2026-05-12 P15.6-r63i (R307 / PA-0039): default OFF.
      // Pre-r63i: `!== false` → labels ON by default. Stefan-Quote:
      // "please disable the lables for the paralell sliders (pop up und
      // inline) by default". Opt-in via `show_labels: true`.
      const showLabels = cfg.parallel_sliders?.show_labels === true;
      // Stefan-2026-05-10 P15.6-r29 (R180): parallel-inline default
      // height now matches the compact-group `full_length_sliders: false`
      // resolved height (220 px post-r25). The earlier 170 px default
      // looked too short next to the compact slider in side-by-side
      // demos. Opt into 260 px via `parallel_sliders.full_length: true`
      // (matches compact + full_length:true). Explicit `slider.height`
      // still wins over the new default.
      const fullLengthParallel = cfg.parallel_sliders?.full_length === true;
      const sliderH = cfg.slider?.height ?? (fullLengthParallel ? 260 : 220);
      const labelTitle = cfg.name ?? (stateObj.attributes.friendly_name as string | undefined) ?? cfg.entity;
      const userIcon = cfg.icon;
      const haIcon = stateObj.attributes.icon as string | undefined;
      const iconName = userIcon ?? haIcon ?? 'mdi:lightbulb';
      const isOn = stateObj.state === 'on';
      const rgb = stateObj.attributes.rgb_color as [number, number, number] | undefined;
      // Stefan-2026-05-11 P15.6-r63d (R298 / PA-0031): inline color is now
      // OPT-IN via `cfg.icon_color`. r63c shipped entity-RGB as the default
      // which made the single-light icon visually inconsistent with the
      // rest of the dashboard (gold). Default behaviour (`icon_color`
      // unset) → no inline style, themed gold CSS applies. Opt-in:
      //   `icon_color: 'on-state'` → RGB + brightness-modulated opacity
      //   `icon_color: '<color>'`  → literal CSS color override (any value
      //                              valid in `color:`, including `var()`)
      // See computeIconStateColor helper at top of file.
      const _bri = stateObj.attributes.brightness as number | undefined;
      const parallelIconStateColor = computeIconStateColor(cfg.icon_color, isOn, rgb, _bri);
      // Stefan-2026-05-09 P47-fix R58: parallel-inline mindmap-layout
      // restructured. SVG renders the groupDot circle (state-reactive,
      // gold/rgb stroke) AND the curves. HTML icon-glyph overlays the
      // groupDot center. Same architecture as the Card 6 expanded view
      // (group-layout-expanded). Curves leave the groupDot's edges
      // horizontally — matches Stefan's reference screenshot 20.05.58.
      const mindmapMembers = modes.map(() => ({
        state: stateObj.state,
        rgb,
        brightness: stateObj.attributes.brightness as number | undefined,
      }));
      // Stefan-2026-05-12 R327 (PA-0008): `parallel_sliders.layout: compact`
      // drops the curve-bg mindmap SVG and the orbiting icon, rendering
      // sliders + icon + caption in a minimal vertical stack. Use when
      // parallel-inline is embedded inside a larger group's topology and
      // the surrounding mindmap-arms already provide the visual structure.
      // Stefan-2026-05-12 R332 (PA-0012): compact ALSO collapses the modes
      // array to brightness-only (applied above where `modes` is computed);
      // this `parallelCompact` flag drives the structural-layout swap.
      const parallelCompact = parallelLayoutIsCompact;
      const parallelInner = parallelCompact
        ? html`
            <div class="parallel-compact-layout">
              <ha-state-icon
                class="parallel-compact-icon ${isOn ? 'active' : ''}"
                style=${parallelIconStateColor}
                data-interactive=${cfg.gestures?.member_icon ? 'true' : null}
                .hass=${this.hass}
                .stateObj=${stateObj}
                .icon=${iconName}
              ></ha-state-icon>
              <div class="single-picker">${this._picker.renderPicker()}</div>
              <div class="parallel-slider-row">
                ${modes.map(
                  (m) => html`
                    <div class="parallel-inline-col">
                      ${showLabels ? html`<span class="parallel-inline-lbl">${m}</span>` : null}
                      <everyday-vertical-pill-slider
                        style=${`--everyday-slider-height: ${sliderH}px`}
                        .hass=${this.hass}
                        .entity=${cfg.entity}
                        .mode=${m}
                      ></everyday-vertical-pill-slider>
                    </div>
                  `,
                )}
              </div>
              <div class="caption">
                <span class="name">${labelTitle}</span>
              </div>
            </div>
          `
        : html`
            <div class="parallel-mindmap-layout">
              <div class="parallel-slider-row">
                ${modes.map(
                  (m) => html`
                    <div class="parallel-inline-col">
                      ${showLabels ? html`<span class="parallel-inline-lbl">${m}</span>` : null}
                      <everyday-vertical-pill-slider
                        style=${`--everyday-slider-height: ${sliderH}px`}
                        .hass=${this.hass}
                        .entity=${cfg.entity}
                        .mode=${m}
                      ></everyday-vertical-pill-slider>
                    </div>
                  `,
                )}
              </div>
              <div class="parallel-mindmap-area">
                <everyday-mindmap-path
                  class="parallel-mindmap-bg"
                  aria-hidden="true"
                  .members=${mindmapMembers}
                  .dotsEnabled=${false}
                  .groupDotEnabled=${true}
                  .groupYOverride=${60}
                  .memberYOverride=${10}
                  .groupOn=${isOn}
                  .groupRgb=${rgb}
                ></everyday-mindmap-path>
                <ha-state-icon
                  class="parallel-mindmap-icon ${isOn ? 'active' : ''}"
                  style=${parallelIconStateColor}
                  .hass=${this.hass}
                  .stateObj=${stateObj}
                  .icon=${iconName}
                ></ha-state-icon>
                <div class="parallel-picker">${this._picker.renderPicker()}</div>
              </div>
              <div class="caption">
                <span class="name">${labelTitle}</span>
              </div>
            </div>
          `;
      // Stefan-2026-05-12 R328 (PA-0008): drop the outer ha-card when embedded.
      // The parent's nested-member rendering provides the surface; an inner
      // ha-card paints a second background. Mirrors the group-render branch
      // pattern at line ~1006 (`if (cfg.embedded) return groupContent`).
      if (cfg.embedded === true) return parallelInner;
      return html`<ha-card>${parallelInner}</ha-card>`;
    }

    // Auto-detect group membership. layout: 'compact' STILL renders the
    // group view (just with the compact prop driving a single-slider +
    // group-icon layout). The earlier P5 short-circuit that returned null
    // for `compact` predated the P8 compact implementation and was the real
    // reason Stefan kept seeing the single-light fallback - resolveGroup
    // was never being called when compact was set.
    const groupCfg = this.config.group ?? {};
    const resolved = resolveGroup(this.hass, this.config.entity, groupCfg.manual_members);

    if (resolved) {
      const cfg = this.config;
      const longPressMs = cfg.gestures?.long_press_ms ?? 200;
      const memberTap = cfg.gestures?.member_icon?.tap === 'none' || cfg.gestures?.member_icon?.tap === 'classic_more_info'
        ? cfg.gestures.member_icon.tap
        : 'toggle';
      const wheelType = cfg.color_wheel?.type === 'smooth' ? 'smooth' : 'stepped';
      // Stefan-2026-05-10 P15.6-r47 (R227): wheel default bumped to
       // 21 hues × 6 rings (was 12 × 4). Smoother gradient, more
       // saturation steps. Stefan-Quote: "this should be color wheel
      // default: type: stepped, hue_segments: 21, saturation_rings: 6,
      // persistent: true". Persistent is already true by default.
      const wheelHues = cfg.color_wheel?.hue_segments ?? 21;
      const wheelRings = cfg.color_wheel?.saturation_rings ?? 6;
      const sliderW = cfg.slider?.width;
      const sliderH = cfg.slider?.height;
      const compact = groupCfg.layout === 'compact';
      const wheelPersistent = cfg.color_wheel?.persistent !== false; // default true
      const savedPersistent = cfg.saved_colors?.persistent !== false; // default true
      const persistentSliderMode = cfg.slider?.persistent_mode === true; // default false
      const iconPosition = groupCfg.icon_position === 'top' ? 'top' : 'bottom'; // default 'bottom'
      // Smart default for mindmap_dots: 'top' → false, 'bottom' → true.
      // Explicit user value overrides.
      const mindmapDots =
        typeof groupCfg.mindmap_dots === 'boolean'
          ? groupCfg.mindmap_dots
          : iconPosition !== 'top';
      // Stefan-2026-05-10 P15.6-r48 (R208): when `embedded: true`, skip
      // the outer <ha-card> chrome. The parent card embeds this instance
      // as a member tile inside its grid — having a second ha-card with
      // its own background + shadow would visually fragment the layout.
      // Stefan-2026-05-11 R275 (Issue 6): pass top-level config.name and
      // config.icon through to the group-layout component so they take
      // precedence over derived values (state friendly_name / state.attr.icon).
      // Previously these attrs were silently dropped — Stefan PA-13: "die
      // attribute name und icon haben keinen effekt (müssen aber)".
      const groupContent = html`
        <everyday-group-layout-expanded
          .hass=${this.hass}
          group-entity=${resolved.groupEntityId}
          .memberIds=${resolved.memberIds}
          .memberConfigs=${resolved.memberConfigs}
          .groupName=${cfg.name}
          .groupIconName=${cfg.icon}
          .longPressMs=${longPressMs}
          .memberTap=${memberTap}
          .groupDoubleTapAction=${cfg.gestures?.group_icon?.double_tap}
          .wheelType=${wheelType}
          .wheelHues=${wheelHues}
          .wheelRings=${wheelRings}
          .sliderWidth=${sliderW}
          .sliderHeight=${sliderH}
          .compact=${compact}
          .wheelPersistent=${wheelPersistent}
          .savedPersistent=${savedPersistent}
          .persistentSliderMode=${persistentSliderMode}
          .iconPosition=${iconPosition}
          .mindmapDots=${mindmapDots}
          .savedColorsConfig=${cfg.saved_colors}
          .parallelSlidersConfig=${cfg.parallel_sliders}
          .fullLengthSliders=${groupCfg.full_length_sliders === true}
          .expansionMode=${groupCfg.expansion_mode ?? 'inline'}
          .expandInPlace=${groupCfg.expand_in_place === true}
          .iconColor=${cfg.icon_color}
          .cycleModes=${cfg.cycle?.modes}
          .effectsEditable=${cfg.effects_picker?.editable !== false}
          .embedded=${cfg.embedded === true}
          .depth=${this.depth}
          .hideParent=${cfg.parent_node === 'hide'}
          .showIcons=${cfg.show_icons !== false}
          .showMindmap=${cfg.show_mindmap !== false}
        ></everyday-group-layout-expanded>
      `;
      if (cfg.embedded === true) {
        return groupContent;
      }
      return html`<ha-card>${groupContent}</ha-card>`;
    }

    // (parallel-render branch was hoisted above group-detection — see
    // R50 comment near top.)

    // Single-entity fallback (P3 layout). Default mode by domain:
    //   light.*        → 'brightness' (or temp/hue/saturation if config-set)
    //   media_player.* → 'volume'
    // Stefan-2026-05-12 P15.6-r63l (R314 / PA-0043): when 1-mode parallel
    // falls through to this path, use the configured parallel mode as the
    // slider mode. So `default_view_mode: parallel, modes: [temperature]`
    // renders as a bare single-light card with the temperature slider.
    const oneModeParallelOverride =
      this.config.default_view_mode === 'parallel'
      && this.config.parallel_sliders?.modes?.length === 1
      ? this.config.parallel_sliders.modes[0]
      : undefined;
    const userMode = oneModeParallelOverride ?? this.config.mode;
    let mode: 'brightness' | 'temperature' | 'volume' | 'hue' | 'saturation';
    if (userMode === 'temperature' || userMode === 'volume' || userMode === 'brightness' || userMode === 'hue' || userMode === 'saturation') {
      mode = userMode;
    } else if (domain === 'media_player') {
      mode = 'volume';
    } else {
      mode = 'brightness';
    }
    const orientation = this.config.slider?.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const styleVariant = this.config.slider?.style === 'mixer' ? 'mixer' : 'pill';
    const showButtons = this.config.slider?.show_buttons === true;
    const label = this.config.name ?? (stateObj.attributes.friendly_name as string | undefined) ?? this.config.entity;
    const sliderStyles = [
      this.config.slider?.width ? `--everyday-slider-width: ${this.config.slider.width}px` : '',
      this.config.slider?.height ? `--everyday-slider-height: ${this.config.slider.height}px` : '',
    ]
      .filter(Boolean)
      .join('; ');

    // Stefan-2026-05-10 P15.6-r31 (R163-step2) — Bubble-Card-inspired
    // speaker row. Layout grew from [name | slider | − | +] to
    // [icon | name+state | slider | − | + | ▶/⏸]:
    //   icon       : ha-state-icon for media_player.* — entity-registry
    //                resolved icon, falls back to mdi:speaker. Reactive
    //                color when playing.
    //   name+state : title (cfg.name | friendly_name) + sub-line showing
    //                normalized state ("playing" / "paused" / "idle" /
    //                "off"). Skipped sub-line when entity is off so off-
    //                state cards stay visually quiet.
    //   slider     : unchanged horizontal mixer-volume.
    //   − / +      : unchanged ±5% volume buttons (white pill thumbs).
    //   ▶/⏸       : play/pause toggle. Reads stateObj.state to flip
    //                between media_play/media_pause services. When the
    //                player is OFF or unavailable the button still shows
    //                ▶ but the click no-ops via `if (!hass)`.
    // step-3 deferrals (BACKLOG.md): source picker (long-press →
    // mode-picker variant), per-speaker theme tinting from artwork,
    // queue / shuffle indicators.
    if (styleVariant === 'mixer' && domain === 'media_player' && showButtons) {
      const entityId = this.config.entity;
      const onMinus = (): void => {
        void this.hass?.callService('media_player', 'volume_down', { entity_id: entityId });
      };
      const onPlus = (): void => {
        void this.hass?.callService('media_player', 'volume_up', { entity_id: entityId });
      };
      const isPlaying = stateObj.state === 'playing';
      const onPlayPause = (): void => {
        if (!this.hass) return;
        // media_play_pause toggles in-place when supported (most modern
        // media_player integrations); the explicit branch keeps the icon
        // semantics tight for users on integrations that only expose one
        // direction.
        if (isPlaying) {
          void this.hass.callService('media_player', 'media_pause', { entity_id: entityId });
        } else {
          void this.hass.callService('media_player', 'media_play', { entity_id: entityId });
        }
      };
      const stateLabel = (() => {
        switch (stateObj.state) {
          case 'playing': return 'playing';
          case 'paused': return 'paused';
          case 'idle': return 'idle';
          case 'buffering': return 'buffering';
          case 'on': return 'on';
          case 'off': return '';  // hide sub-line when off
          case 'unavailable': return 'offline';
          default: return stateObj.state;
        }
      })();
      const speakerIcon = this.config.icon ?? (stateObj.attributes.icon as string | undefined) ?? 'mdi:speaker';
      return html`
        <ha-card class="speaker-row-card">
          <div class="speaker-row v2 ${isPlaying ? 'playing' : ''}" style=${sliderStyles}>
            <ha-state-icon class="speaker-icon" .stateObj=${stateObj} .icon=${speakerIcon}></ha-state-icon>
            <div class="speaker-name-col">
              <span class="speaker-name">${label}</span>
              ${stateLabel ? html`<span class="speaker-state">${stateLabel}</span>` : ''}
            </div>
            <everyday-vertical-pill-slider
              class="speaker-slider"
              .hass=${this.hass}
              .entity=${this.config.entity}
              .mode=${'volume'}
              .orientation=${'horizontal'}
              .styleVariant=${'mixer'}
            ></everyday-vertical-pill-slider>
            <button class="speaker-btn" type="button" @click=${onMinus} aria-label="Volume down">−</button>
            <button class="speaker-btn" type="button" @click=${onPlus} aria-label="Volume up">+</button>
            <button
              class="speaker-btn play-pause"
              type="button"
              @click=${onPlayPause}
              aria-label=${isPlaying ? 'Pause' : 'Play'}
            >${isPlaying ? '⏸' : '▶'}</button>
          </div>
        </ha-card>
      `;
    }

    // Stefan-2026-05-09 P47-fix: single-entity card now renders an icon
    // tile in the caption (above the name) so the card has visual identity
    // matching the group-card icon-tile pattern. Icon precedence:
    //   1. config.icon (user override)
    //   2. stateObj.attributes.icon (HA-native icon, e.g. from entity registry)
    //   3. domain fallback (mdi:lightbulb / mdi:speaker)
    const userIcon = this.config.icon;
    const haIcon = stateObj.attributes.icon as string | undefined;
    const fallbackIcon = domain === 'media_player' ? 'mdi:speaker' : 'mdi:lightbulb';
    const iconName = userIcon ?? haIcon ?? fallbackIcon;
    const isOn = stateObj.state === 'on';
    // Stefan-2026-05-11 P15.6-r63d (R298 / PA-0031): inline color is now
    // OPT-IN via `cfg.icon_color`. r63c shipped entity-RGB as the default
    // which made the single-light icon visually inconsistent with the
    // rest of the dashboard (gold). Default `icon_color` unset → no inline
    // style → themed gold CSS applies. Opt-in:
    //   'on-state'        → entity RGB + brightness-modulated opacity
    //   <CSS color string> → literal color override regardless of state
    // See computeIconStateColor helper at top of file.
    const _rgb = stateObj.attributes.rgb_color as [number, number, number] | undefined;
    const _bri = stateObj.attributes.brightness as number | undefined;
    const iconStateColor = computeIconStateColor(this.config.icon_color, isOn, _rgb, _bri);

    // Stefan-2026-05-09 P47-fix R47: horizontal-orientation gets a row layout
    // with [icon | slider | name+state] — same inline-expand-style geometry
    // as the speaker-row mixer card but without the volume buttons. Vertical
    // orientation keeps the original column layout (slider + caption below).
    if (orientation === 'horizontal') {
      return html`
        <ha-card class="hpill-card">
          <div class="hpill-row" style=${sliderStyles}>
            <div class="single-icon-wrap">
              <ha-icon class="single-icon ${isOn ? 'active' : ''}" icon=${iconName} style=${iconStateColor}></ha-icon>
              <!-- Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): see comment
                   on the vertical-orientation render for rationale. Single-
                   icon must own a picker overlay slot for long-press to
                   render anything. -->
              <div class="single-picker">${this._picker.renderPicker()}</div>
            </div>
            <everyday-vertical-pill-slider
              class="hpill-slider"
              .hass=${this.hass}
              .entity=${this.config.entity}
              .mode=${mode}
              .orientation=${'horizontal'}
              .styleVariant=${styleVariant}
            ></everyday-vertical-pill-slider>
            <div class="hpill-caption">
              <span class="name">${label}</span>
              <!-- Stefan-2026-05-12 R324 (PA-0005): drop on/off from state-line.
                   Keep mode-suffix when mode is not default brightness, since
                   that conveys real info (which slider axis is active). -->
              ${mode === 'temperature' || mode === 'volume'
                ? html`<span class="state">${mode === 'temperature' ? 'temp' : 'vol'}</span>`
                : ''}
            </div>
          </div>
        </ha-card>
      `;
    }

    // Stefan-2026-05-09 P47-fix R62: revert single-entity to the simple
    // P3 layout (slider + caption). Mindmap-arms are reserved for the
    // parallel-inline case (Cards 2, 3, 6b) where N axes give the arms a
    // purpose. Single-light card just wants a slider + name + state.
    // Stefan-2026-05-11 R273: add the missing icon-circle to the simple
    // vertical layout. The P47-fix comment at line 899 already promised
    // an icon-tile here but only the horizontal-orientation branch wired
    // it up (line 919). Stefan PA-13 issue 4: `light.hall_spot_1` (vertical
    // default) shows no icon. ha-state-icon resolves the entity-registry
    // icon (e.g. user's mdi:track-light customization); `.icon` is the
    // resolved fallback chain (config.icon | state.attr.icon | domain default).
    return html`
      <ha-card>
        <div class="container ${orientation}" style=${sliderStyles}>
          <everyday-vertical-pill-slider
            .hass=${this.hass}
            .entity=${this.config.entity}
            .mode=${mode}
            .orientation=${orientation}
            .styleVariant=${styleVariant}
          ></everyday-vertical-pill-slider>
          <div class="caption">
            <div class="single-icon-wrap">
              <ha-state-icon
                class="single-icon ${isOn ? 'active' : ''}"
                data-interactive=${this.config.gestures?.member_icon ? 'true' : null}
                style=${iconStateColor}
                .hass=${this.hass}
                .stateObj=${stateObj}
                .icon=${iconName}
              ></ha-state-icon>
              <!-- Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): mount the
                   picker overlay here so long-press on the .single-icon has
                   a DOM container to render its 4-option ring into.
                   Pre-r63e: r62 R289 wired bindIcon(.single-icon) so the
                   gesture detector DID fire, but renderPicker() was only
                   rendered in the parallel-mode path — long-press silently
                   opened a picker that had nowhere to show. Same picker
                   instance as the parallel-mode mount, just positioned
                   around the single-icon when this render path is active. -->
              <div class="single-picker">${this._picker.renderPicker()}</div>
            </div>
            <span class="name">${label}</span>
            <!-- Stefan-2026-05-12 R324 (PA-0005): drop on/off from state-line.
                 Keep mode-suffix when mode is not default brightness, since
                 that conveys real info (which slider axis is active). -->
            ${mode === 'temperature' || mode === 'volume'
              ? html`<span class="state">${mode === 'temperature' ? 'temp' : 'vol'}</span>`
              : ''}
          </div>
        </div>
      </ha-card>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      /* Stefan-2026-05-09 P12 R99: stretch to horizontal-stack height so
         all cards in a row match the tallest. Lovelace horizontal-stack
         flex-stretches its children; this propagates down to ha-card. */
      height: 100%;
    }
    /* Stefan-2026-05-11 R261: embedded cards now sit at their NATURAL
       intrinsic height at col-top (no flex-end packing). The previous
       R248-R252 flex-end was forcing all siblings to col-bottom — visually
       uniform but flattened depth-info Stefan now wants visible (PA-09:
       "die höhe der dots für main und back muss unterschiedlich sein,
       weil Main viel höher ist als Back"). With R262 .member-cols {
       align-items: start } in group-layout-expanded.styles, each col is
       content-sized; embedded host fills the col naturally, its group-icon
       sits at content-bottom = card-bottom. Cards with less depth (Main)
       end higher than cards with more depth (Back). Mindmap dots track
       per-member-Y via the memberYs prop. Kept: position:relative +
       z-index:3 (R248 stacking-context fix for long-press hit-testing). */
    :host([embedded]) {
      position: relative;
      z-index: 3;
      /* Stefan-2026-05-11 R271: stretch the embedded card to fill its
         parent .member-col which itself stretches via the new R271
         justify-items stretch on .member-cols. Without width 100%,
         the host stays content-width centered inside the col, leaving
         a visible empty channel between sibling cards. With this, the
         card spans the full col, its inner member-cols grid fills,
         sliders distribute evenly across the parent's slice of the
         card width. Stefan PA-12: die slider sollen die ganze breite
         der Karte einnehmen. */
      width: 100%;
    }
    ha-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ha-card > .container,
    ha-card > .parallel-mindmap-layout,
    ha-card > .effects-card,
    ha-card > .hpill-row,
    ha-card > .speaker-row {
      flex: 1 1 auto;
    }
    /* Stefan-2026-05-09 P47 R31d — default_view_mode: parallel renders N
       sliders side-by-side inline (no popup). Same column model as the
       parallel-popup: label on top, slider below. */
    .parallel-inline {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      /* Stefan-2026-05-12 P15.6-r63l (R313 / PA-0043): 24px parity with
         .container / .layout / .layout.compact (R303). Pre-r63k was
         16/16/20 — visually short on the bottom. */
      padding: 24px;
    }
    /* Stefan-2026-05-09 P47-fix R52: parallel-inline icon = mindmap-node
       circle (same as single-entity .caption .single-icon). */
    .parallel-inline .single-icon {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--paper-item-icon-color, #c1c1c1);
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      box-sizing: border-box;
    }
    .parallel-inline .single-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }

    /* Stefan-2026-05-09 P47-fix R54: shared layout for single-entity and
       parallel-inline cards. Slider(s) on top, mindmap-arms SVG in the
       middle (1 arm for N=1, N arms for parallel), group-icon-circle at
       bottom, name+state. The mindmap connects slider(s) to the icon
       visually — at N=1 the arm is a vertical line, at N>1 the arms fan
       out from the central group-dot. */
    .parallel-mindmap-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      /* Stefan-2026-05-12 P15.6-r63l (R313 / PA-0043): 24px parity with
         .container / .layout / .layout.compact (R303). Pre-r63k was
         14/14/16 — different from every other render surface, Stefan
         flagged "padding is wrong ... I dont understand how it can be
         different". */
      padding: 24px;
      /* P12 R97: position:relative anchor for the wheel-overlay child. */
      position: relative;
    }
    /* Stefan-2026-05-12 R327 (PA-0008): compact variant of parallel-inline.
       Drops the .parallel-mindmap-area SVG + orbiting icon. Used for nested
       embedded members where the surrounding card's mindmap arms already
       provide topology. Layout: small icon on top, slider-row below, no
       curve-bg, minimal padding. */
    .parallel-compact-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px;
      position: relative;
    }
    .parallel-compact-icon {
      --mdc-icon-size: 28px;
      color: var(--paper-item-icon-color, #c1c1c1);
      pointer-events: auto;
      /* R326: bound element + must declare touch-action statically. */
      touch-action: none;
    }
    .parallel-compact-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    .parallel-compact-layout .single-picker {
      position: absolute;
      top: 22px;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      z-index: 41;
      touch-action: none;
    }
    .parallel-slider-row {
      display: flex;
      flex-direction: row;
      gap: 0;
      /* Stefan-2026-05-09 P12 R103: space-around distributes the sliders
         exactly where mindmap-path's simple (i+0.5)/N * W formula puts
         the memberX positions, so the arms hit slider-centers without
         a gap-aware adjustment dance. */
      justify-content: space-around;
      align-items: flex-end;
      width: 100%;
    }
    .parallel-slider-row .parallel-inline-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .parallel-slider-row .parallel-inline-lbl {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
    }
    /* Stefan-2026-05-09 P47-fix R58: SVG renders groupDot circle + curves;
       HTML icon-glyph overlays groupDot center. SVG height 90px so c1
       control points (groupY - vs*0.05 with vs ≈ 70) leave the group dot
       horizontally — matches the Card 6 expanded view aesthetic. The
       icon-glyph itself has NO border or background; the SVG groupDot
       provides the state-reactive circle. */
    .parallel-mindmap-area {
      position: relative;
      width: 100%;
      height: 90px;
      flex: 0 0 auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parent overlay covering
         the icon + picker dots. Without touch-action none here, finger drifting
         off .dot back onto this wrapper re-evaluates the chain and unlocks
         scroll. Belt-and-suspenders with .parallel-mindmap-icon's own rule. */
      touch-action: none;
    }
    .parallel-mindmap-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .parallel-mindmap-icon {
      position: absolute;
      /* Stefan-2026-05-09 P12 R100 alignment fix: SVG groupYOverride=60 in
         90px SVG → groupDot center at y=60 from top → 30 from bottom.
         Icon size 26 → halfsize 13. Bottom = 30 - 13 = 17. */
      bottom: 17px;
      left: 50%;
      transform: translateX(-50%);
      --mdc-icon-size: 26px;
      color: var(--paper-item-icon-color, #c1c1c1);
      pointer-events: auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parallel-inline bind-target.
         Per W3C pointer-events-3 spec the touch-action chain is read at first
         pointerdown and frozen for the gesture's lifetime — R323's late
         scroll-lock at the 200ms long-press timer can't undo a scroll commit
         the browser made by the first pointermove. Mirror of .single-icon
         [data-interactive] declaration. */
      touch-action: none;
    }
    .parallel-mindmap-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    .parallel-mindmap-layout > .caption {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-top: 6px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
    }
    .parallel-mindmap-layout > .caption .name { font-weight: 500; }
    .parallel-mindmap-layout > .caption .state {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .parallel-inline-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      text-align: center;
    }
    .parallel-inline-row {
      display: flex;
      gap: 22px;
      align-items: flex-end;
      justify-content: center;
    }
    .parallel-inline-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .parallel-inline-lbl {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      /* Stefan-2026-05-11 P15.6-r63f (R303-followup / PA-0033): padding
         16 -> 24 px so single-light .container matches .layout (24 px)
         and .layout.compact (24 px from r63e). Stefan-Quote PA-0033:
         "fix alles" — covers the r63e follow-up note "single-light
         .container also at 24 px to keep all 3 surfaces matching".
         Visual outcome: single-light cards gain 8 px on each side. */
      padding: 24px;
    }
    .caption {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
    }
    .caption .name {
      font-weight: 500;
    }
    .caption .state {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    /* Stefan-2026-05-09 P47-fix R52: single-entity card icon-tile is now
       a mindmap-node-style circle — gold stroke when off, entity-rgb
       stroke when on. Matches the visual identity of the group-icon-circle
       in the expanded view's mindmap. Stefan-Decision: "die 1 Mindmap ist
       nur ein Kreis, ohne Arme" (= just the circle, no arms; arms are
       only meaningful for N≥2 multi-axis layouts). */
    .caption .single-icon {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--paper-item-icon-color, #c1c1c1);
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      margin-bottom: 4px;
      box-sizing: border-box;
    }
    .caption .single-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    /* Stefan-2026-05-11 R289 (PA-14): when gestures.member_icon is set
       in config, the single-icon is bound to the picker (long-press =>
       wheel/saved popup; double-tap => configured action). Make the
       interactivity visible via hand-cursor on hover, and disable native
       touch-action so the gesture-detector pointer events aren't hijacked
       by scroll/pinch on touch devices. R111-safe: no backticks in CSS comments. */
    .caption .single-icon[data-interactive] {
      cursor: pointer;
      touch-action: none;
    }
    /* Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): wrapper around the
       .single-icon so the picker overlay can be absolutely positioned
       centered over the icon. Without this wrap the picker overlay would
       size relative to .caption (slider + name + state column) and end up
       offset. Reuses the same z-index ceiling as .parallel-mindmap-area
       and the same overlay positioning as .parallel-picker. Applies to
       BOTH the vertical .caption layout AND the horizontal .hpill-row
       layout. R111-safe: no backticks in CSS comments. */
    .single-icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .single-icon-wrap .single-picker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      z-index: 41;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parent overlay covering
         drag-traversal between dots. Mirror of .parallel-picker. */
      touch-action: none;
    }
    /* Stefan-2026-05-09 P47-fix R47: horizontal-pill row layout —
       [icon | slider | name+state]. Mirrors the speaker-row mixer card but
       without the volume buttons. Slider gets flex-grow so it stretches to
       fill the available width between icon and caption. */
    ha-card.hpill-card {
      background: rgba(0, 0, 0, 0.5);
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border: none;
    }
    .hpill-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 14px;
      /* Stefan-2026-05-11 P15.6-r63f (R303-followup / PA-0033): bumped
         horizontal padding 16 -> 24 px to match .container / .layout /
         .layout.compact uniform 24 px padding. Vertical 10 px kept so
         the row stays narrow enough to fit horizontal-stack rows of
         multiple pill cards. */
      padding: 10px 24px;
    }
    .hpill-slider {
      width: 100%;
    }
    .hpill-caption {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 13px;
      min-width: 80px;
      text-align: right;
    }
    .hpill-caption .name { font-weight: 500; }
    .hpill-caption .state { font-size: 11px; color: var(--secondary-text-color); }

    /* Stefan-2026-05-10 P15.6-fix R121: picker wrapper anchored at icon
       CENTER, not icon-bottom. Icon: bottom:17, halfsize:13 → center at
       bottom:30. Wrapper has 0×0 size; the mode-picker child renders its
       picker dots orbiting around wrapper origin, so origin == icon-center
       lands the dots correctly around the icon. Stefan-2026-05-10:
       previously without wrapper the dots landed at .parallel-mindmap-area
       top-left ("zu weit links und zu weit oben"). */
    .parallel-mindmap-area .parallel-picker {
      position: absolute;
      bottom: 30px;
      left: 50%;
      z-index: 41;
      pointer-events: auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): finger drifting between
         dots crosses this wrapper. Without touch-action none the chain
         re-evaluates and the browser can claim the touch. */
      touch-action: none;
    }
    .parallel-picker-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      pointer-events: auto;
    }
    /* Stefan-2026-05-09 P12 R97: parallel-inline wheel-overlay on long-press
       of the parallel-mindmap-icon. MVP: full-card overlay with the wheel
       centered. Outside-click closes; click on the wheel itself
       stops-propagation so the user can pick. */
    .parallel-wheel-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      animation: parallel-wheel-fade-in 180ms ease-out;
    }
    .parallel-wheel-popup {
      transform: scale(0.95);
      animation: parallel-wheel-bloom 200ms cubic-bezier(0.16, 1.06, 0.46, 1.04) forwards;
    }
    @keyframes parallel-wheel-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes parallel-wheel-bloom {
      0%   { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1);   opacity: 1; }
    }

    /* Stefan-2026-05-09 P12 R95: mobile responsive. Demo broken on iPhone-
       width screens. Quick wins: shrink padding, allow slider-row to wrap
       (so 4-axis parallel doesn't overflow), reduce slider gap. */
    @media (max-width: 480px) {
      .parallel-mindmap-layout {
        padding: 10px 8px 12px;
      }
      .parallel-slider-row {
        gap: 12px;
        flex-wrap: wrap;
      }
      .parallel-mindmap-area {
        height: 70px;
      }
      .container {
        padding: 12px;
      }
      .effects-card {
        padding: 12px 8px 14px;
      }
      .hpill-row {
        grid-template-columns: auto 1fr;
        gap: 10px;
        padding: 8px 12px;
      }
      .hpill-caption {
        display: none;
      }
    }

    /* Stefan-2026-05-09 P38.1: effects-picker standalone card layout. */
    .effects-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 14px 16px;
      align-items: center;
    }
    .effects-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      font-weight: 500;
    }
    /* Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): standalone color-wheel /
       saved-colors display-mode card layout. Mirrors .effects-card so the
       three "no-slider" picker tiles share the same chrome. */
    .display-mode-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px 14px 16px;
      align-items: center;
    }
    .display-mode-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      font-weight: 500;
    }
    .display-mode-wheel-wrap {
      width: 100%;
      max-width: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
    }
    .display-mode-wheel-wrap everyday-color-wheel {
      width: 100%;
    }

    .placeholder {
      padding: 16px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      line-height: 1.5;
    }
    .placeholder.error {
      color: var(--error-color, #c62828);
    }
    code {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.05));
      padding: 1px 4px;
      border-radius: 3px;
      font-family: var(--code-font-family, 'Roboto Mono', monospace);
    }

    /* Stefan-2026-05-10 R163-step1 + R167 - speaker-row layout v2:
       - Bubble-Card-inspired: -/+ buttons styled like the brightness-slider
         thumb (white pill, dark text). Stefan: "+ / - buttons sollen
         aussehen wie der Thumb des brightness sliders".
       - Card no longer stretches to row-max height (speaker demo card was
         huge because horizontal-stack flex-stretch propagated through the
         global ha-card height:100% rule). Override here so the card hugs
         its 56 px row.
    */
    ha-card.speaker-row-card {
      background: var(--card-background-color, rgba(0, 0, 0, 0.5));
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      border: none;
      /* R167: override global ha-card height:100% so the card doesn't
         stretch to its parent flex/grid row-max. */
      height: auto;
      flex: 0 0 auto;
    }
    .speaker-row {
      display: grid;
      grid-template-columns: 80px 1fr 36px 36px;
      align-items: center;
      gap: 10px;
      height: 56px;
      padding: 0 14px 0 0;
    }
    /* Stefan-2026-05-10 P15.6-r31 (R163-step2): v2 grid adds icon (start)
       and play-pause (end) columns. Name+state stack lives in a flex-col
       container so the secondary state-line sits below the title without
       breaking the single-row outer grid. */
    .speaker-row.v2 {
      grid-template-columns: 44px minmax(86px, max-content) 1fr 32px 32px 32px;
      gap: 10px;
      height: 60px;
      padding: 0 12px 0 12px;
    }
    .speaker-icon {
      justify-self: center;
      align-self: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      color: var(--secondary-text-color, #b1b3c8);
      --mdc-icon-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 200ms ease, background 160ms ease;
    }
    .speaker-row.v2.playing .speaker-icon {
      color: var(--state-light-active-color, #f88d2a);
      background: rgba(248, 141, 42, 0.18);
    }
    .speaker-name-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      overflow: hidden;
      gap: 2px;
    }
    .speaker-state {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .speaker-row.v2 .speaker-name {
      padding-left: 0;
      font-size: 14px;
    }
    .speaker-row.v2 .speaker-btn.play-pause {
      font-size: 14px;
      /* Use the icon character itself for the visible label; same pill
         dimensions as the −/+ buttons so the button cluster reads as one
         row of identical-shape controls. */
    }
    .speaker-name {
      justify-self: start;
      align-self: center;
      padding-left: 20px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-weight: 500;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .speaker-slider {
      width: 100%;
      align-self: center;
    }
    /* Stefan-2026-05-10 R163-step1: -/+ buttons mirror the brightness-
       slider thumb - white pill, dark text, slightly squished proportions.
       Same drop-shadow as the thumb so the buttons read as the same kind
       of thing as the visible slider control. Bubble-Card sub-button
       inspiration: clean, monochrome, low-decoration. */
    .speaker-btn {
      justify-self: center;
      align-self: center;
      width: 32px;
      height: 22px;
      border-radius: 11px;
      border: none;
      background: var(--everyday-thumb-bg, #ffffff);
      color: var(--primary-text-color, #1d1f3a);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
      transition: transform 100ms ease, box-shadow 120ms ease;
    }
    .speaker-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.22);
    }
    .speaker-btn:active {
      transform: scale(0.95);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-light-card': EverydayLightCard;
  }
}
