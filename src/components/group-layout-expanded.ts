/**
 * group-layout-expanded - Phase 5 deliverable.
 *
 * Renders the canonical "expanded" group view (CONCEPT.md R2 + design-mock
 * `assets/design-mocks/group-layout-expanded-n3.html`):
 *
 *   ┌──────────────────────────────────────┐
 *   │  [slider 1]  [slider 2]  [slider 3]  │   N vertical-pill-sliders, one per member
 *   │  [icon 1]    [icon 2]    [icon 3]    │   member tiles (icon + label)
 *   │       (mindmap-path SVG)             │   state-reactive curves group → members
 *   │              [group icon]            │   group tile (tap = toggle with restore)
 *   └──────────────────────────────────────┘
 *
 * Composition
 *   - `<everyday-vertical-pill-slider>` for each member (Phase 3 component).
 *   - `<everyday-mindmap-path>` for the connecting curves (Phase 4 component).
 *   - `<ha-icon>` from HA's frontend for member + group glyphs.
 *
 * Group-tap-toggle wires through to `groupToggleWithRestore` (CONCEPT R3).
 *
 * Member-icon tap is intentionally a no-op in P5 (CONCEPT R1 default).
 * Phase 6 wires long-press → mode-picker; Phase 7 adds double-tap → saved-colors.
 */

import { LitElement, html, render, type CSSResult, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state, queryAll } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';

import './vertical-pill-slider.js';
import './mindmap-path.js';
import './mode-picker.js';
import './color-wheel.js';
import './saved-colors-picker.js';
import './effects-list-picker.js';
import './scenes-list-picker.js';
import type { MindmapMember } from './mindmap-path.js';
import type { SliderMode } from './vertical-pill-slider.js';
import type { ColorTuple, ColorEntry } from './saved-colors-picker.js';
import type {
  SavedColorsConfig,
  ScenesPickerConfig,
  ParallelSlidersConfig,
  EverydayLightCardConfig,
  ManualMember,
  GestureAction,
} from '../types/config.js';

import { groupToggleWithRestore } from '../helpers/group-toggle.js';
import { discoverScenesForEntity } from '../helpers/scenes-discovery.js';
import { POPUP_PORTAL_STYLES } from '../helpers/popup-portal-styles.js';
import { computeIconStateColor } from '../helpers/icon-color.js';
import { computeMemberColsGap, resolveOverflow, GAP_MAX_BY_DEPTH } from '../helpers/member-cols-gap.js';
import { GROUP_LAYOUT_EXPANDED_STYLES } from './group-layout-expanded.styles.js';
import {
  groupName as deriveGroupName,
  memberLabel as deriveMemberLabel,
  toMindmapMembers as deriveMindmapMembers,
  isLightOn,
  resolveEntityIcon,
} from '../helpers/group-derive.js';
import {
  readSavedColorsFromSource,
  persistSavedColorsToSource,
  readSavedColorsFromUserData,
  persistSavedColorsToUserData,
} from '../helpers/saved-colors-persistence.js';
import { PickerController } from '../helpers/picker-controller.js';

/**
 * Default saved-colors palette (P7 Tier 1). Eight cells = 2×4 grid that
 * matches the HA-Standard `more-info` colour-section Stefan called out in
 * PHASE-1-COMMENTS.md. User-driven add/remove mutates this array in
 * component state; persistence to a helper / HA favourites is a P7.1
 * follow-up.
 */
const DEFAULT_SAVED_COLORS: ColorTuple[] = [
  [248, 141, 42],   // warm orange (brand)
  [255, 250, 234],  // warm white
  [200, 220, 255],  // cool white
  [255, 90, 90],    // red
  [255, 220, 90],   // amber
  [120, 220, 130],  // green
  [120, 180, 250],  // blue
  [200, 100, 220],  // purple
];

/**
 * Picker-mode union — must stay in sync with `mode-picker.ts PickerMode`.
 * Stefan-2026-05-10 P15.6-r35 (R196 + R197): added 'cycle' (next-mode
 * picker slot) and 'effects' (effects-list slot, conditional).
 * Stefan-2026-05-12 PA-0002 (R2a): added 'collapse' (fold inline-expanded
 * compact card back; gated to `group-expanded` variant + sticky config).
 */
type PickerMode = 'temp' | 'wheel' | 'saved' | 'mindmap' | 'parallel' | 'cycle' | 'effects' | 'collapse';

/**
 * Picker-variant union — must stay in sync with `mode-picker.ts PickerVariant`.
 */
type PickerVariant = 'member' | 'group-compact' | 'group-expanded';

/**
 * Hit-test the press-drag-select gesture against the picker layout for a
 * given variant. `dx`, `dy` are pointer offsets in screen coords (y positive
 * down). Returns the picker mode under the pointer or `null` (dead-zone /
 * out-of-range).
 *
 * Layouts (verbatim from mode-picker._renderedOptions):
 *   'member':         Wheel 90° (bot), Temp 210° (top-left), Saved 330° (top-right).
 *                     120° sectors centred on each dot.
 *   'group-compact':  Wheel 90° (bot), Saved 0° (right), Temp 180° (left),
 *                     Mindmap 270° (top). 90° sectors.
 *   'group-expanded': Wheel 0° (right), Saved 180° (left). Half-plane each.
 *                     Stefan-2026-05-09 R6 — 2-option pickers go horizontal.
 */
// Stefan-2026-05-10 P15.6: pickerHoverFromPointer no longer needed here —
// every picker (member + compact + expanded) goes through PickerController
// which calls it internally. Only pickerDotPosition stays for the
// _applyPickerMode body-portal popup-anchor calculation.
import { pickerDotPosition } from '../helpers/picker-geometry.js';

/**
 * Stefan-2026-05-11 R253: recursively count "leaves" in a `manual_members`
 * tree, used to weight the parent's grid columns so deeper subtrees get
 * more horizontal space. A bare-string member counts as 1. An object-form
 * member with its own `manual_members` recursively sums children. An
 * object-form member without explicit `manual_members` (auto-resolves via
 * HA group state) also counts as 1 — we don't have hass-state access at
 * this static module scope, and 1 is a safe lower bound.
 */
function countManualMembersLeaves(
  members: ManualMember[] | undefined,
): number {
  if (!members || members.length === 0) return 1;
  let total = 0;
  for (const m of members) {
    if (typeof m === 'string') {
      total += 1;
    } else {
      total += countManualMembersLeaves(m.group?.manual_members);
    }
  }
  return total;
}

@customElement('everyday-group-layout-expanded')
export class EverydayGroupLayoutExpanded extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ type: String, attribute: 'group-entity' }) groupEntityId = '';
  @property({ type: Array, attribute: false }) memberIds: string[] = [];
  /**
   * Stefan-2026-05-10 P15.6-r48 (R208): per-member config map (keyed by
   * entity_id). When set, members listed here render as nested embedded
   * cards (with their own group/parallel_sliders/etc) instead of the
   * regular slider tile. Set by the parent card via `resolveGroup`'s
   * `memberConfigs` payload — bare-string members aren't in this map.
   */
  @property({ attribute: false }) memberConfigs: Map<
    string,
    Partial<EverydayLightCardConfig>
  > = new Map();

  /**
   * Stefan-2026-05-10 P15.6-r48 (R229): user-configurable cycle mode list.
   * When set, the cycle picker action steps through this list in order
   * instead of the color_mode-driven heuristic. Each entry is a
   * SliderMode: 'brightness' | 'temperature' | 'hue' | 'saturation'.
   * Stefan-Quote: "needs a section for 'cycle mode' as well (where you
   * can select which sliders to cycle (brightness, hue, temp, saturation)".
   */
  @property({ attribute: false }) cycleModes?: SliderMode[];

  /** Optional override for the group icon's mdi name. */
  @property({ type: String, attribute: 'group-icon' }) groupIconName?: string;
  /** Optional override for the per-member mdi name. */
  @property({ type: String, attribute: 'member-icon' }) memberIconName?: string;
  /**
   * Stefan-2026-05-11 R275 (PA-13 Issue 6): explicit user-facing label
   * override. When set (via the host's top-level `name:` config), wins over
   * the derived friendly_name. Previously the compact/expanded group-tile
   * always rendered `hass.states[entity].attributes.friendly_name` and
   * silently ignored `config.name`.
   */
  @property({ type: String, attribute: 'group-name' }) groupName?: string;

  /** Press-drag-select hold time. Default 200 ms (Stefan-tuned 2026-05-08). */
  @property({ type: Number, attribute: 'long-press-ms' }) longPressMs = 200;

  /** Color-wheel config passed through from card config. */
  @property({ type: String, attribute: 'wheel-type' }) wheelType: 'stepped' | 'smooth' = 'stepped';
  // Stefan-2026-05-10 P15.6-r47 (R227): defaults bumped from 12×4 to
  // 21×6 (matches everyday-light-card.ts host fallback + color-wheel
  // component defaults). Stefan-Quote: "this should be color wheel
  // default: hue_segments: 21, saturation_rings: 6".
  @property({ type: Number, attribute: 'wheel-hues' }) wheelHues = 21;
  @property({ type: Number, attribute: 'wheel-rings' }) wheelRings = 6;

  /** Slider sizing override (px). When unset, the embedded sliders use the
   *  group-view defaults (47×170 via :host CSS vars). */
  @property({ type: Number, attribute: 'slider-width' }) sliderWidth?: number;
  @property({ type: Number, attribute: 'slider-height' }) sliderHeight?: number;

  /** Member-icon tap behavior. Default 'toggle' (Stefan-override 2026-05-08;
   *  CONCEPT.md R1 default was 'none'). */
  @property({ type: String, attribute: 'member-tap' }) memberTap: 'none' | 'toggle' | 'classic_more_info' = 'toggle';

  /**
   * Stefan-2026-05-12 R325 (PA-0006): host-supplied double-tap action for
   * THIS card's group icon (both compact and expanded variants). When unset,
   * the historical default kicks in (cycle_mode in compact, no-op in
   * expanded). Configured via the host's `gestures.group_icon.double_tap`
   * field. Routed in `_runDoubleTapAction` so the same action vocabulary
   * applies whether the icon is in compact or expanded state. Per-MEMBER
   * double-tap actions are read directly from `memberConfigs.get(id)?.
   * gestures?.member_icon?.double_tap` inside `_createMemberPicker`, no
   * separate property needed.
   */
  @property({ attribute: false }) groupDoubleTapAction?: GestureAction;

  /**
   * When true, render the compact view (single group slider + group icon).
   * Long-pressing the group icon toggles `_compactExpanded` to show the
   * full N-slider expanded view in-place.
   */
  @property({ type: Boolean }) compact = false;
  @state() private _compactExpanded = false;
  /**
   * Stefan-2026-05-12 PA-0002 (R2a): sticky-expansion flag. When true:
   *   - `_compactExpanded` is mirrored to localStorage under the key
   *     `everyday-light-card:expanded:${groupEntityId}`.
   *   - On mount the card reads the persisted state and restores it.
   *   - Tap-outside no longer collapses (handled by outside-click handler).
   *   - The expanded-group picker grows a 'collapse' slot so users can
   *     fold the topology back via the press-drag-select menu.
   * Default false (legacy session-only state, outside-click collapses).
   * Stefan-Quote: "lets make it so, that the expansion state is
   * remembered. that is better. Pople can choose to for a node ... if
   * it should be collapsed automatically or not".
   */
  @property({ type: Boolean, attribute: 'expansion-sticky' }) expansionSticky = false;

  /**
   * Stefan-2026-05-12 R334 (PA-0015): runtime visible-leaf-count cache,
   * keyed by member entityId. Populated by `visible-leaf-count-change`
   * events bubbled up from embedded `<everyday-light-card>` children
   * (which in turn aggregate their own inner `<everyday-group-layout-
   * expanded>` state). Read by `_memberLeafWeight` which prefers the
   * runtime cache over the static config-based count.
   *
   * Effect: when a nested compact child is inline-expanded at runtime
   * (long-press → mindmap → expand), the child's visible-leaf-count
   * jumps from 1 → N, the event bubbles to here, the cache updates,
   * `requestUpdate` fires, and the grid-template-columns redistributes
   * so the parent's child cols reflect the actual visible-leaf density
   * at THIS moment. Stefan-Quote PA-0015: "they should be evenly spaced
   * at each step of the expansion".
   */
  @state() private _childVisibleLeafCounts: Map<string, number> = new Map();
  /**
   * Picker controllers for group-tile + member-tiles (Stefan-2026-05-10
   * P15.5/P15.6). All instantiated up-front; bound via `bindIcon(el|null)`
   * from `updated()` based on which view is on screen. `onPickerOpen` on
   * each fires `_closePickersExcept` so opening one closes all others
   * (single-active-picker invariant). `onModePicked` routes mode-picks
   * back to the host's body-portal popup machinery via `_applyPickerMode`.
   * Member-pickers live in `_memberPickers` Map keyed by entityId — the
   * Map is rebuilt in `_rebindMemberGestures` when memberIds change.
   */
  private _expandedGroupPicker = new PickerController(this, {
    variant: 'group-expanded',
    longPressMs: 200,
    hassProvider: () => this.hass,
    entityIdProvider: () => this.groupEntityId,
    currentSliderModeProvider: () => {
      const m = this._memberModes[this.groupEntityId];
      return (m === 'temperature' || m === 'hue' || m === 'saturation') ? m : 'brightness';
    },
    onTap: () => this._onGroupTap(new Event('synthetic-tap')),
    // Stefan-2026-05-12 R325 (PA-0006): config-driven double-tap on the
    // expanded-group icon. Bathroom/Kitchen case from Stefan's nested config
    // — they render as nested everyday-light-cards, each with its own
    // expanded layout, and want `color_wheel`/`saved_colors` on group-icon
    // double-tap. When unset, no double-tap action (preserves pre-R325
    // expanded-group behaviour where double-tap was a silent no-op).
    onDoubleTap: () => {
      const action = this.groupDoubleTapAction;
      if (!action) return;
      // Stefan-2026-05-12 R326 (PA-0007 deep-dive): pass captured iconOrigin
      // so wheel/saved popups bloom from the icon center. captureOrigin()
      // ran inside the gesture-detector wrapper before this closure fires.
      this._runDoubleTapAction(this.groupEntityId, action, 'group-expanded', this._expandedGroupPicker.origin);
    },
    onModePicked: (mode, origin) => {
      this._applyPickerMode(this.groupEntityId, mode as PickerMode, origin, 'group-expanded');
    },
    onPickerOpen: () => this._closePickersExcept(this._expandedGroupPicker),
    // Stefan-2026-05-12 PA-0002 (R1): effects slot opt-in flag forwarded.
    effectsInPickerProvider: () => this.effectsInPicker,
    // Stefan-2026-05-12 PA-0002 (R2a): expose 'collapse' slot when sticky
    // expansion is on AND the card is currently inline-expanded. Without
    // this, users on sticky-expansion cards have no way to fold the
    // topology back (outside-click is suppressed under sticky).
    hasCollapseProvider: () => this.expansionSticky
      && ((this.compact && this._compactExpanded) || !this.compact),
  });
  private _compactGroupPicker = new PickerController(this, {
    variant: 'group-compact',
    longPressMs: 200,
    hassProvider: () => this.hass,
    entityIdProvider: () => this.groupEntityId,
    currentSliderModeProvider: () => {
      const m = this._memberModes[this.groupEntityId];
      return (m === 'temperature' || m === 'hue' || m === 'saturation') ? m : 'brightness';
    },
    onTap: () => this._onGroupTap(new Event('synthetic-tap')),
    // Stefan-2026-05-12 R325 (PA-0006): config-driven double-tap on the
    // compact-group icon. Spots case from Stefan's nested config — a
    // compact sub-group with `expansion_mode: inline` that wants `expand_inline`
    // on double-tap (skips the long-press→mindmap picker path). When no
    // action is configured, falls back to the pre-R325 default
    // (cycle_mode) so existing user configs keep working.
    onDoubleTap: () => {
      const action = this.groupDoubleTapAction;
      if (action) {
        // Stefan-2026-05-12 R326: pass captured origin for popup anchoring.
        this._runDoubleTapAction(this.groupEntityId, action, 'group-compact', this._compactGroupPicker.origin);
        return;
      }
      // Stefan-2026-05-09 R8 default: cycle the group slider's mode.
      // Reuses _setMemberMode + _cycleNextMode so the temp-mode auto-apply
      // side-effect fires here too.
      this._setMemberMode(this.groupEntityId, this._cycleNextMode(this.groupEntityId));
    },
    onModePicked: (mode, origin) => {
      this._applyPickerMode(this.groupEntityId, mode as PickerMode, origin, 'group-compact');
    },
    onPickerOpen: () => this._closePickersExcept(this._compactGroupPicker),
    // Stefan-2026-05-11 R238: when the card is embedded as a nested-group
    // member of a parent, swap the picker's 'parallel' slot for 'mindmap'
    // (expand-inline). Provider pattern reads `this.embedded` at gesture
    // time so the swap stays in sync with attribute changes after
    // controller construction.
    useMindmapProvider: () => this.embedded,
    // Stefan-2026-05-11 R290 (PA-14): for STANDALONE compact-group cards
    // (`group.layout: compact`, not embedded), append 'mindmap' as a 5th/
    // 6th picker slot so the user can expand the topology view from the
    // compact tile. The embedded path already swaps parallel→mindmap via
    // useMindmapProvider above and skips this branch (useMindmap wins
    // when both are true). When the card isn't compact at all, neither
    // provider fires and the picker keeps its 4/5-slot default.
    additionalMindmapProvider: () => this.compact && !this.embedded,
    // Stefan-2026-05-12 PA-0002 (R1): effects slot opt-in flag forwarded.
    effectsInPickerProvider: () => this.effectsInPicker,
  });
  private _memberPickers = new Map<string, PickerController>();

  /** Color-wheel popup persistence (default true). When false, popup closes after the first pick. */
  @property({ type: Boolean, attribute: 'wheel-persistent' }) wheelPersistent = true;
  /** Saved-colors popup persistence (default true). */
  @property({ type: Boolean, attribute: 'saved-persistent' }) savedPersistent = true;
  /**
   * Stefan-2026-05-10 P15.6-r49 (R230): effects-list edit-mode opt-in.
   * Default false → long-press on an active row in the popup is a no-op
   * (clean pick-only surface). Set `effects_picker.editable: true` in
   * card config to expose the edit-mode flow. Cross-session storage of
   * the active-order per-light is post-launch follow-up.
   */
  @property({ type: Boolean, attribute: 'effects-editable' }) effectsEditable = false;
  /**
   * Stefan-2026-05-12 PA-0002 (R1): effects slot in long-press mode-picker
   * is opt-in. Pre-PA-0002 the slot auto-appeared for any entity reporting
   * a non-empty effect_list — most color bulbs do, so cards showed the slot
   * by default. Now defaults `false`. Set `effects_picker.in_picker: true`
   * in card config to bring it back.
   */
  @property({ type: Boolean, attribute: 'effects-in-picker' }) effectsInPicker = false;
  /**
   * Slider-mode persistence across off → on transitions. Default false:
   * a non-brightness mode is reset to brightness when the member light turns
   * off, so the user always sees brightness on re-activation. true keeps
   * whatever mode was last cycled to.
   */
  @property({ type: Boolean, attribute: 'persistent-slider-mode' }) persistentSliderMode = false;

  /**
   * Where the group ("main light") icon sits in both compact and expanded views.
   *   'bottom' (default): sliders/tiles on top, group icon at the bottom.
   *     Matches the original P5 design. Group icon's screen-Y shifts
   *     downward when the compact view expands.
   *   'top': group icon on top, sliders/tiles below. Anchors the group
   *     icon's screen-Y across the compact ↔ expanded transition. Stefan
   *     tagged this "falsch herum" so it's opt-in.
   */
  @property({ type: String, attribute: 'icon-position' }) iconPosition: 'top' | 'bottom' = 'bottom';

  /**
   * Render the mindmap-path placeholder dots (colored circles around member
   * and group icon centers). When true the SVG draws stroke-colored circles
   * that act as state-rings + halo. The card-level resolver sets a smart
   * default: 'top' → false, 'bottom' → true.
   */
  @property({ type: Boolean, attribute: 'mindmap-dots' }) mindmapDots = false;

  /**
   * Saved-colors persistence config (P7.1). When `source: 'static'` we read
   * the initial palette from `static` and don't write back. When `source:
   * 'helper:input_text.<id>'` we read the JSON-encoded palette from the
   * helper's state on every hass push and persist mutations via
   * `input_text.set_value`. Without this prop we fall back to the in-memory
   * default palette (works but is lost on card reload).
   */
  @property({ attribute: false }) savedColorsConfig?: SavedColorsConfig;

  /**
   * Stefan-2026-05-16 PA-0001 (scenes_list): forwarded `scenes_picker` config
   * from the host card. Drives the auto-discovery override (`scenes` list),
   * the prefix-strip toggle, and the `scene.turn_on` transition. When
   * `undefined`, auto-discovery runs with defaults.
   */
  @property({ attribute: false }) scenesPickerConfig?: ScenesPickerConfig;

  /** Per-member previous on/off state, used to detect on→off transitions for the auto-revert logic. */
  private _lastStates: Record<string, string> = {};

  /**
   * Per-member previous `color_mode` attribute. Used by the
   * temperature → brightness auto-revert (Stefan-2026-05-12 R331 / PA-0012):
   * when the light leaves `color_temp` mode (because the user picked a colour
   * via the wheel/saved popup), a slider that was showing the temperature
   * axis is no longer meaningful and gets reset to brightness on the same
   * hass push that delivers the new color_mode.
   */
  private _lastColorModes: Record<string, string> = {};

  /**
   * Per-member last-known `color_temp_kelvin`. Snapshotted on every hass push
   * when the light reports a kelvin value (regardless of whether it's
   * currently in temp mode). When the user activates `'temperature'` slider
   * mode for a member that's on, we re-apply this stored value so the light's
   * colour visibly switches back to the previous temp - matching Stefan's
   * 2026-05-08 expectation that "temp mode → light goes to its previous temp".
   * Falls back to 3500 K when the member has never had a recorded temp.
   */
  private _memberLastTemp: Record<string, number> = {};

  // Per-member transient state (NOT persisted to config).
  // _memberModes: which slider mode each member is showing right now.
  // _wheelTarget: which member's color-wheel popup is open (null = none).
  // _toast: tiny in-card status message (used for the P7 saved-colors stub).
  // (Picker-overlay state — _activePicker / _pickerHover / _pickerOrigin
  //  pre-P15.6 — now lives inside each PickerController instance.)
  @state() private _memberModes: Record<string, SliderMode> = {};
  @state() private _wheelTarget: string | null = null;
  @state() private _toast: string | null = null;
  // Saved-Colors (P7). Defaults to a sensible static palette; user-managed
  // entries are persisted via the helper-source path planned for P7.1.
  @state() private _savedColorsTarget: string | null = null;
  @state() private _savedColors: ColorEntry[] = DEFAULT_SAVED_COLORS.slice();
  @state() private _savedColorsEditing = false;

  // Stefan-2026-05-10 P15.6-r43 (R209 + R214): effects-list popup state.
  // Mirrors the wheel/saved popup pattern: when the user picks 'effects'
  // from the mode-picker, `_effectsTarget` is set to the entity id and
  // the popup blooms in the body-portal at the picker-dot position.
  // R214: effects-list is NOT a view-mode (`default_view_mode:
  // effects-picker` is now deprecated) — it's ALWAYS a popup reachable
  // from the mode-picker effects slot.
  @state() private _effectsTarget: string | null = null;
  // Stefan-2026-05-10 P15.6-r45 (R217): popup edit-mode for the effects list.
  // Long-press a row (default mode) → flip true; long-press a row (edit mode)
  // → delete. Tap outside any row → exit. Visual indicator = title + " · edit"
  // suffix in the popup chrome (matches the parallel-inline path).
  @state() private _effectsEditMode = false;
  // R217 hidden-effects ordering for the popup. Mirrors the parallel-inline
  // path's `_effectsActiveOrder` but lives separately because the popup's
  // target entity changes (multi-card dashboard). When empty, the picker
  // treats `effect_list` as the initial active order.
  @state() private _effectsPopupActiveOrder: string[] = [];

  // Stefan-2026-05-16 PA-0001 (scenes_list): scenes-list popup state. Same
  // shape as `_effectsTarget` — set to the target entity_id when the user
  // double-taps a group/member icon configured with `scenes_list`, and
  // anchors at `_popupOrigin` in the body-portal. Reset to null when the
  // popup closes (outside-click, scene-pick, or group-tap close gesture).
  @state() private _scenesTarget: string | null = null;
  // Stefan-2026-05-16 PA-0005: scenes edit-mode + active-order state for
  // the popup. Mirror of `_effectsEditMode` / `_effectsPopupActiveOrder`.
  // Long-press a scene row in default mode → enter-edit; long-press in
  // edit mode → delete (move to grayed); tap a grayed row → restore.
  // Active-order is per-popup-target (changing target wipes it) to avoid
  // cross-card bleed. Cross-session persistence still lives on the
  // host card via `scenes_picker.source` (parallel-inline path).
  @state() private _scenesEditMode = false;
  @state() private _scenesPopupActiveOrder: string[] = [];

  /**
   * Topology-popup state (Stefan-2026-05-09 P43 R21 — Q3 Decision B).
   * When the user picks the Mindmap option from the compact-group picker,
   * the FULL N-slider topology view renders in the body-portal (not inline).
   * The card itself stays compact — host icon never moves. Click-outside
   * dismisses the popup. Replaces the inline `_compactExpanded` flow as
   * the primary mindmap-trigger result.
   */
  @state() private _topologyPopupOpen = false;

  /**
   * Parallel-sliders popup state (Stefan-2026-05-09 P43 R20). When the user
   * picks the new "Parallel" option from a member long-press picker, a
   * popup mounts with N sliders side-by-side for that entity. `entityId`
   * is the target light/media_player; `modes` is the configured subset
   * of axes (default brightness+temperature+hue+saturation).
   */
  @state() private _parallelSlidersTarget: { entityId: string; modes: SliderMode[] } | null = null;

  /**
   * Stefan-2026-05-09 P45 R25/R26a — popup-anchor rectangles for position-
   * matching popups to the underlying card / slider. When the popup opens,
   * we capture the bounding rect of the element it should overlay (the
   * group-layout host for topology, the member-slider for parallel). The
   * popup-card uses these rects via inline style so it lands EXACTLY where
   * the underlying element is. Original element is hidden via state class.
   *   topology → host's getBoundingClientRect
   *   parallel → member-slider's getBoundingClientRect
   */
  @state() private _topologyAnchorRect: DOMRect | null = null;
  @state() private _parallelAnchorRect: DOMRect | null = null;

  /**
   * Stefan-2026-05-12 R333 (PA-0015): popup-anchor origin for the parallel-
   * sliders popup when triggered from the mode-picker. When set, the popup's
   * bottom-center is positioned at this viewport coord so the popup blooms
   * out of the picker-dot location (matching the color-wheel / saved-colors
   * popup anchoring pattern). When null, the legacy slider-rect anchor
   * (`_parallelAnchorRect`) is used — this is the path for non-picker
   * triggers like the `expand_inline_parallel` double-tap action that has
   * no picker-dot coordinate to anchor to.
   *
   * Stefan-Quote PA-0015: "the bottom center of the paralell sliders pop up
   * shall be, where the modepicker icon vanished". Mirrors the wheel +
   * saved popups which anchor at the picker-dot's viewport position.
   */
  @state() private _parallelPopupOrigin: { x: number; y: number } | null = null;

  /**
   * Optional Parallel-sliders config — drives which axes appear in the
   * parallel-sliders popup. Passed through from the card config. Defaults
   * to the full quartet when unset.
   */
  @property({ attribute: false }) parallelSlidersConfig?: ParallelSlidersConfig;

  /**
   * Stefan-2026-05-09 P44 R24 — slider-length toggle for the topology popup.
   *   false (default): member sliders are 170 px tall so the mindmap-baum
   *                    has room (= the original inline-expand layout).
   *   true:  member sliders match the host compact-slider height (260 px).
   * Drives the `--everyday-slider-height` CSS var on the popup's member-slider
   * elements. Renamed at usage time to communicate the trade-off.
   */
  @property({ type: Boolean, attribute: 'full-length-sliders' }) fullLengthSliders = false;

  /**
   * Compact-group expansion behaviour for the Mindmap picker option
   * (Stefan-2026-05-10 R131). Default 'inline' — picking Mindmap flips
   * `_compactExpanded` so the same card transforms into the N-slider
   * topology view (sibling dashboard cards reflow). 'popup' falls back
   * to the body-portal overlay (the original P43-R21 behaviour). Stefan:
   * "in line expand ist doch besser für dynamisches anpassen der
   * siblings, animationen und so" — popup-expand is opt-in now.
   */
  @property({ type: String, attribute: 'expansion-mode' })
  expansionMode: 'inline' | 'popup' = 'inline';

  /**
   * Stefan-2026-05-11 P15.6-r63d (R300c / PA-0031): when `true` AND
   * the card is compact AND `_compactExpanded` is on (inline-expand
   * via Mindmap picker), the expanded topology shrinks its member
   * sliders so the total card-height stays the same as the
   * pre-expand compact card-height. Group icon's Y-from-top stays
   * constant → the card expands "in place" without pushing siblings.
   *
   * Default `false` — card grows taller on expansion (current
   * behaviour since r17).
   *
   * Drives the slider-height resolution in `_renderTopologyTree`
   * (subtracts a fixed `EXPAND_IN_PLACE_TOPOLOGY_OVERHEAD` from the
   * compact slider-height to derive the expanded slider-height).
   * Empirically-tuned overhead value tunable via `slider.height`
   * config override.
   */
  @property({ type: Boolean, attribute: 'expand-in-place' })
  expandInPlace = false;

  /**
   * Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): propagated from the
   * host card's `icon_color` config field. Drives the inline color on
   * EVERY icon rendered by this layout — group-tile icon (compact +
   * expanded) AND member-tile icons (bare leaves). Reuses the same
   * `computeIconStateColor` helper as the single-light + parallel-
   * mindmap-icon paths, so a single config value gives uniform behavior
   * across all rendering paths.
   *
   * undefined → CSS theming applies (themed gold via R304 unified chain).
   * 'on-state' → each tile reflects ITS OWN entity's RGB + brightness.
   * any other string → literal CSS color override on all icons.
   *
   * Member tiles read each member entity's state; group tile reads the
   * group entity's state. For nested-embedded members, `icon_color` is
   * propagated through the recursive `nestedConfig` spread so the
   * embedded card resolves the same way for ITS own icons.
   */
  @property({ attribute: false })
  iconColor?: 'on-state' | string;

  /**
   * Stefan-2026-05-11 (R235-237): when this group-layout is rendered INSIDE
   * a parent group-layout (as a nested-member embedded card), the standalone
   * defaults (47×170 host vars, 260 px compact-slider override, decorative
   * compact-mindmap-arm) make it visually bigger and taller than its
   * sibling member tiles. With this attribute set, the CSS resets those
   * standalone defaults so the embedded layout matches the parent's
   * member-slider sizing context. Set automatically by the parent
   * everyday-light-card when it recursively embeds a nested member.
   */
  @property({ type: Boolean, reflect: true, attribute: 'embedded' }) embedded = false;

  /**
   * Stefan-2026-05-11 P15.6-r63a (R292 / PA-0019): nesting depth, plumbed
   * from the host `<everyday-light-card>`. Used to scale `.member-cols`
   * `gap` via the `--member-cols-gap` CSS var: depth 0 → 28 px (outermost
   * inter-group boundary, wide), depth 1 → 14 px, depth 2 → 8 px (siblings
   * inside a deeply-nested group), depth ≥ 3 → 4 px. Reflected to the
   * `depth` attribute so CSS attribute-selectors can read it.
   */
  @property({ type: Number, reflect: true, attribute: 'depth' }) depth = 0;

  /**
   * Stefan-2026-05-12 P15.6-r63l (R315 / PA-0043): hide the parent group-row
   * entirely. Used by container-cards (`entity: 'none'` + manual_members)
   * AND by users who want a "row-of-sliders" layout via `parent_node: hide`.
   * When true, _renderTopologyTree skips the group-row div.
   */
  @property({ type: Boolean }) hideParent = false;

  /**
   * Stefan-2026-05-12 P15.6-r63l (R316 / PA-0043): hide ALL icons (members
   * + parent). Slider labels stay. Used together with hideParent + hideMindmap
   * to get a pure row-of-sliders layout.
   */
  @property({ type: Boolean }) showIcons = true;

  /**
   * Stefan-2026-05-12 P15.6-r63l (R317 / PA-0043): hide the mindmap-path
   * SVG (curves + dots between members and parent). Independent of
   * showIcons — you can hide arms but keep icon tiles.
   */
  @property({ type: Boolean }) showMindmap = true;

  /** Active member's icon-center in viewport coords (for in-place wheel + saved popups). */
  @state() private _popupOrigin: { x: number; y: number } | null = null;

  /**
   * Timestamp (epoch ms) when the most recent popup opened. The
   * outside-click listener ignores clicks within 250 ms of this so the
   * "phantom click" the browser dispatches from the press-drag-select
   * pointerup doesn't dismiss the just-opened popup.
   */
  private _popupOpenedAt = 0;

  /**
   * Joined entity-id key from the last `_rebindMemberGestures` call. We
   * compare CONTENT not REFERENCE - resolveGroup() creates a new array on
   * every render, so a reference-based check would force a rebind on every
   * hass push, which races mid-gesture and silently kills the in-flight
   * long-press detection. Comparing the joined string sidesteps that.
   */
  private _lastBoundMemberIds = '';

  @queryAll('.tile.member') private _memberTileEls!: NodeListOf<HTMLElement>;

  private _outsideClickListener?: (ev: MouseEvent) => void;
  private _toastTimer: number | null = null;

  // ---------- lifecycle ----------

  /**
   * Portal element appended to document.body for rendering the wheel /
   * saved-colors popups OUTSIDE this component's shadow root. Stefan-2026-
   * 05-09 P41-R10 fix: HA's dashboard uses `transform` on ancestor elements
   * (sidebar / view animation), which makes `position: fixed` reposition
   * relative to that ancestor instead of the viewport. The popups landed
   * "ganz unten am bildschirm" because the transformed ancestor was offset
   * from viewport-top. The portal lives directly under <body>, where no
   * such transform-ancestor interferes — `position: fixed` is now relative
   * to the viewport as the spec promises.
   */
  private _popupPortal: HTMLDivElement | null = null;
  /** Stylesheet injected once into document.head for the portal's popups. */
  private static _portalStylesInjected = false;

  override connectedCallback(): void {
    super.connectedCallback();
    // Stefan-2026-05-11 P15.6-r63e (R302 / PA-0032): clear the bound-ids
    // guard on every (re)connect so the next updated() pass force-rebinds
    // the gesture handlers. HA dashboard view-switches may rebuild the
    // element's DOM without firing property-changes, so the guard's
    // memberIds-changed condition skips the rebind path — fresh DOM
    // without gesture handlers manifests as "parent group-icon click
    // does nothing after switching views". Symmetric clear with
    // disconnectedCallback.
    this._lastBoundMemberIds = '';
    if (!this._popupPortal) {
      this._popupPortal = document.createElement('div');
      this._popupPortal.className = 'everyday-popup-portal';
      document.body.appendChild(this._popupPortal);
    }
    if (!EverydayGroupLayoutExpanded._portalStylesInjected) {
      const style = document.createElement('style');
      style.id = 'everyday-popup-portal-styles';
      style.textContent = POPUP_PORTAL_STYLES;
      document.head.appendChild(style);
      EverydayGroupLayoutExpanded._portalStylesInjected = true;
    }
    // Stefan-2026-05-11 R260: ResizeObserver on each .member-col tracks
    // the per-col content-height so the mindmap-path's memberYs[] reflects
    // each member's actual icon Y. Triggers a re-render whenever a col
    // grows or shrinks (e.g., when a nested member inline-expands).
    if (typeof ResizeObserver !== 'undefined') {
      this._memberColRO = new ResizeObserver((entries) => {
        let changed = false;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const entityId = el.getAttribute('data-entity');
          if (!entityId) continue;
          const h = Math.round(entry.contentRect.height);
          if (this._memberColHeights.get(entityId) !== h) {
            this._memberColHeights.set(entityId, h);
            changed = true;
          }
        }
        if (changed) {
          this.requestUpdate();
          // Stefan-2026-05-12 R319 (PA-0044): a per-col height change
          // signals a child compact↔expanded transition (or a nested
          // re-layout). The width of our .member-cols may not have
          // changed (so the width-RO won't fire), but our overflow
          // assessment must be re-evaluated because the SHAPE of what
          // we contain just changed. Trigger a fresh recompute so
          // resolveOverflow can re-check whether the now-rendered
          // descendants need a slider-width override applied.
          this._scheduleGapRecompute();
        }
      });
      // Stefan-2026-05-12 R299 (PA-0041): separate RO on the parent
      // `.member-cols` element watches container-width changes so the
      // dynamic --member-cols-gap recomputes on resize, depth-change
      // cascade, or any layout shift that reflows this card. rAF-
      // coalesced via `_scheduleGapRecompute` to avoid burst-firing
      // during animations (compact↔expanded transitions, browser
      // resize-drag).
      this._memberColsRO = new ResizeObserver(() => {
        this._scheduleGapRecompute();
      });
    }
    // Stefan-2026-05-12 PA-0002 (R2a): restore persisted expansion state
    // on mount when sticky-expansion is configured. Defensive: only restore
    // when compact (the expansion only applies to compact-then-inline-expanded
    // paths). Reads BEFORE the first render so the initial paint already
    // shows the persisted state — avoids a jarring collapse→expand flash.
    this._restoreExpansionFromStorage();
    // Stefan-2026-05-12 R349 (PA-0019): listen for `slider-width-need`
    // events bubbling up from descendant cards. Each card fires this
    // event with the smallest slider-width that fits its OWN content;
    // we take the min across all descendants and apply as our own
    // override so all sub-trees use the same uniform width. Without
    // this, when one branch (e.g. bathroom) overflows and shrinks while
    // a sibling branch (e.g. hall) has space and stays at 60, the
    // visual is asymmetric — Stefan PA-0019 complaint.
    this.addEventListener(
      'slider-width-need',
      this._onChildSliderNeed as EventListener,
    );
    // Stefan-2026-05-13 R352 (PA-0020): listen for `nested-layout-change`
    // events from embedded children that signal "my layout-shape changed,
    // remeasure my icon-Y". Used when the child's compact↔expanded toggle
    // doesn't trigger the per-col ResizeObserver reliably (sub-pixel
    // height changes). We re-measure synchronously in the same frame so
    // the parent's mindmap arm catches up to the child's new icon-center
    // immediately, eliminating the 1-2 frame visual lag Stefan flagged
    // in PA-0020.
    this.addEventListener(
      'nested-layout-change',
      this._onNestedLayoutChange as EventListener,
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // All picker controllers (expanded, compact, member) dispose via their
    // own hostDisconnected hook. The Map is cleared explicitly to drop
    // local references; Lit handles the actual controller lifecycle.
    this._memberPickers.clear();
    this._removeOutsideClickListener();
    if (this._toastTimer !== null) clearTimeout(this._toastTimer);
    // Clear lit-rendered popup template + remove the portal node.
    if (this._popupPortal) {
      render(html``, this._popupPortal);
      this._popupPortal.remove();
      this._popupPortal = null;
    }
    this._memberColRO?.disconnect();
    this._memberColRO = undefined;
    this._memberColHeights.clear();
    // Stefan-2026-05-12 R299 (PA-0041): tear down the gap-recompute
    // observer and rAF in disconnect so a fresh remount starts clean.
    this._memberColsRO?.disconnect();
    this._memberColsRO = undefined;
    this._observedMemberColsEl = null;
    if (this._gapRecomputeRaf) {
      cancelAnimationFrame(this._gapRecomputeRaf);
      this._gapRecomputeRaf = 0;
    }
    this._computedMemberColsGap = undefined;
    // Stefan-2026-05-12 R349 (PA-0019): tear down sibling-coordination
    // listener and clear per-child needs map. A fresh mount starts with
    // empty needs and re-collects from descendants.
    this.removeEventListener(
      'slider-width-need',
      this._onChildSliderNeed as EventListener,
    );
    this._childSliderNeeds.clear();
    this._childMinSliderNeed = undefined;
    // Stefan-2026-05-13 R352 (PA-0020): tear down nested-layout-change
    // listener.
    this.removeEventListener(
      'nested-layout-change',
      this._onNestedLayoutChange as EventListener,
    );
    // Stefan-2026-05-11 P15.6-r63e (R302 / PA-0032): clear the bound-ids
    // guard so a fresh mount (e.g. HA dashboard view-switch destroys + re-
    // creates the card DOM) gets a forced rebind in the next updated()
    // pass. Without this, the guard sees the same memberIds.join() string
    // post-remount and SKIPS the rebind, leaving the new DOM elements
    // without gesture handlers. The previously-bound DOM nodes are gone
    // with the element, so the picker's "already bound" state references
    // stale nodes — visible as parent-group-icon click no-op after view-
    // switch (R294 reopen / R302 narrower-repro).
    this._lastBoundMemberIds = '';
  }

  /** Stefan-2026-05-11 R260: per-member-col rendered heights (px),
   *  populated by the ResizeObserver. Used to compute memberYs[] for
   *  the mindmap-path so dots track the actual icon Y per col. */
  private _memberColHeights = new Map<string, number>();
  private _memberColRO?: ResizeObserver;
  private _observedMemberCols = new Set<Element>();

  /** Stefan-2026-05-12 P15.6 R299 (PA-0041): dynamic --member-cols-gap.
   *  Container-width-driven gap value (px) computed by
   *  `computeMemberColsGap` from `helpers/member-cols-gap.ts`. `undefined`
   *  before the first ResizeObserver measurement — render() falls back
   *  to the depth-static absolute (matches the CSS `:host([depth='N'])`
   *  rules so the pre-measurement paint stays FOUC-free). */
  @state() private _computedMemberColsGap?: number;
  /** Stefan-2026-05-12 P15.6 R319-R322 (PA-0044): local override for
   *  `--everyday-slider-width` written inline on `.layout` when this
   *  card's children would otherwise overlap. Computed by
   *  `resolveOverflow` from the same recompute pass as the gap.
   *  `undefined` when the baseline (cascaded) slider width already fits,
   *  which is the common case. Descendants of this card inherit the
   *  override; siblings under the same parent are unaffected. */
  @state() private _computedSliderWidthOverride?: number;
  /** Stefan-2026-05-12 R349 (PA-0019): minimum slider-width need broadcast
   *  by descendant cards via `slider-width-need` events. Tracked per child-
   *  entity in `_childSliderNeeds`; we keep the GLOBAL min (across all
   *  descendants) here as a single number for fast effective-width lookup.
   *  Rationale: when one branch of the tree (e.g. bathroom inside back's
   *  apartment view) detects overflow and shrinks to 48 px, all OTHER
   *  branches (kitchen + hall) currently keep their default 60 px because
   *  their own `.member-cols` doesn't overflow. Result: visually-mismatched
   *  slider widths across the same parent — Stefan's PA-0019 complaint
   *  "all sliders become smaller width, except the sliders in the same
   *  group as spots". Fix: every card listens for descendants' shrinks and
   *  applies the GLOBAL MIN as its own override, which cascades to all
   *  descendants via CSS-var. Stable: the bottleneck child's min always
   *  fits everywhere (by definition of min); after one rAF the tree
   *  converges. */
  @state() private _childMinSliderNeed?: number;
  /** Per-child entity → smallest slider-width-need they reported.
   *  `_childMinSliderNeed = min(values)`. Cleared on disconnect. */
  private _childSliderNeeds = new Map<string, number>();
  /** Stefan-2026-05-12 R299: separate RO for the `.member-cols` parent
   *  container (singular). Watches THIS card's container-width to
   *  recompute the gap. Disjoint from `_memberColRO` (plural, watches
   *  each `.member-col` for height to feed memberYs). */
  private _memberColsRO?: ResizeObserver;
  private _observedMemberColsEl: Element | null = null;
  /** rAF handle for coalescing burst RO callbacks during animations. */
  private _gapRecomputeRaf = 0;

  /**
   * Stefan-2026-05-12 PA-0002 (R2a): localStorage key for the persisted
   * inline-expanded state of a sticky-expansion compact group. One key per
   * group entity so nested cards / sibling cards persist independently.
   * Read by `_restoreExpansionFromStorage` (called from connectedCallback)
   * and written by `_persistExpansionToStorage` (called from updated()
   * when `_compactExpanded`/`groupEntityId`/`expansionSticky` change).
   *
   * Returns null when storage is unavailable (private browsing, quota
   * exceeded) or when `groupEntityId` isn't set — the helpers no-op in
   * that case so the card falls back to legacy session-only behaviour.
   */
  private _expansionStorageKey(): string | null {
    if (!this.groupEntityId) return null;
    return `everyday-light-card:expanded:${this.groupEntityId}`;
  }

  /**
   * Stefan-2026-05-12 PA-0002 (R2a): read persisted state on mount when
   * sticky-expansion is configured. Defensive: swallows any storage
   * exception (private browsing, denylist) and leaves state at its
   * default `false`. Only applies to compact cards — non-compact cards
   * are always expanded and don't have a "collapsed" state to persist.
   */
  private _restoreExpansionFromStorage(): void {
    if (!this.expansionSticky || !this.compact) return;
    const key = this._expansionStorageKey();
    if (!key) return;
    try {
      const v = window.localStorage.getItem(key);
      if (v === '1') this._compactExpanded = true;
      else if (v === '0') this._compactExpanded = false;
    } catch {
      // Storage unavailable — fall back to legacy session-only behaviour.
    }
  }

  /**
   * Stefan-2026-05-12 PA-0002 (R2a): write the current state to localStorage
   * under the per-entity key. Skipped when sticky-expansion is off (the
   * legacy session-only mode shouldn't leave persisted artifacts behind).
   * Also skipped for non-compact cards. Defensive: swallows storage
   * exceptions like the read helper.
   */
  private _persistExpansionToStorage(): void {
    if (!this.expansionSticky || !this.compact) return;
    const key = this._expansionStorageKey();
    if (!key) return;
    try {
      window.localStorage.setItem(key, this._compactExpanded ? '1' : '0');
    } catch {
      // Storage write failed (quota or private mode) — best effort.
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    // Stefan-2026-05-12 PA-0002 (R2a): restore on first updated AFTER
    // the `expansionSticky` / `compact` / `groupEntityId` props have all
    // landed. connectedCallback() may run before properties are set
    // (Lit binds props in a microtask), so the connectedCallback restore
    // may have run with stale defaults. This re-run catches up.
    if (
      (changed.has('expansionSticky') || changed.has('compact') || changed.has('groupEntityId'))
      && this.expansionSticky && this.compact
    ) {
      this._restoreExpansionFromStorage();
    }
    // Stefan-2026-05-12 R334 (PA-0015): dispatch our aggregated visible-
    // leaf-count whenever a state that affects it changes. The event
    // bubbles to our embedding parent's `<everyday-light-card>` listener
    // (registered via `@visible-leaf-count-change` on the embedded card
    // in `_renderMember`). The parent's `_onChildVisibleLeafCountChange`
    // caches our count, triggers `requestUpdate`, and re-renders with
    // updated gridTemplateColumns reflecting our new visible-leaf-count.
    //
    // composed:true crosses the shadow-DOM boundary so the listener on
    // the OUTER `<everyday-light-card>` element receives it (the
    // intermediate `<everyday-light-card>` host re-emits via natural
    // bubbling on composed events). The event is idempotent — the
    // parent's handler dedupes by checking the cached prev count.
    const vlcAffected =
      changed.has('_compactExpanded') ||
      changed.has('_childVisibleLeafCounts') ||
      changed.has('memberIds') ||
      changed.has('compact');
    if (vlcAffected) {
      this.dispatchEvent(
        new CustomEvent('visible-leaf-count-change', {
          bubbles: true,
          composed: true,
          detail: { count: this._currentVisibleLeafCount() },
        }),
      );
    }
    // Rebind ONLY when the member-id CONTENT changes (entities added/
    // removed). resolveGroup() returns a new array reference every render,
    // so reference-based change-detection would rebind on every hass push -
    // which races mid-gesture and kills the in-flight long-press detector.
    // Comparing the joined string is content-based and stable.
    // Stefan-2026-05-11 P15.6-r63e (R302 / PA-0032): ALSO rebind when the
    // guard string is empty (= fresh mount after a previous disconnect
    // cleared it in disconnectedCallback). Without this, an HA dashboard
    // view-switch that destroys + recreates the card DOM lands here with
    // changed.has('memberIds') = false (Lit didn't see a value-change),
    // and the guard skips the rebind → newly-rendered group-tile DOM has
    // no gesture handlers → parent-icon long-press / tap silently no-op.
    const isFreshMount = this._lastBoundMemberIds === '' && this.memberIds.length > 0;
    if (changed.has('memberIds') || isFreshMount) {
      const idsKey = this.memberIds.join(',');
      if (idsKey !== this._lastBoundMemberIds) {
        this._lastBoundMemberIds = idsKey;
        this._rebindMemberGestures();
      }
    }
    // Auto-revert slider mode to brightness on light-off (Stefan 2026-05-08).
    // Iterates members AND the group entity so the compact-collapsed group
    // slider also reverts to brightness when the group is fully off
    // (Stefan-2026-05-09 follow-up). Skip if the user opted into
    // persistent_mode. On the first hass push (`_lastStates` empty), we
    // just snapshot without reverting.
    if (changed.has('hass') && !this.persistentSliderMode) {
      let modesPatch: Record<string, SliderMode> | null = null;
      const isFirstPass = Object.keys(this._lastStates).length === 0;
      const idsForLifecycle = [...this.memberIds, this.groupEntityId];
      for (const id of idsForLifecycle) {
        const next = this.hass?.states[id]?.state ?? 'unavailable';
        const prev = this._lastStates[id];
        if (!isFirstPass && prev === 'on' && next === 'off') {
          const cur = this._memberModes[id];
          if (cur && cur !== 'brightness') {
            if (!modesPatch) modesPatch = { ...this._memberModes };
            modesPatch[id] = 'brightness';
          }
        }
        this._lastStates[id] = next;

        // Stefan-2026-05-12 R331 (PA-0012): temperature → brightness auto-revert
        // when the light leaves `color_temp` mode. If the slider is showing the
        // temperature axis and the user just picked a colour (wheel / saved-
        // colours popup), the light's color_mode flips from `color_temp` to a
        // colour mode (`hs` / `rgb` / `rgbw` / `rgbww` / `xy`). The temperature
        // slider is no longer meaningful in that state, so snap it back to
        // brightness on the same hass push that delivers the flipped color_mode.
        // Symmetric reverse (colour → color_temp) is intentionally NOT applied:
        // the user controls when they want the temperature slider back via the
        // mode-picker, so we don't yank them out of brightness unprompted.
        const nextColorMode = (this.hass?.states[id]?.attributes?.color_mode as string | undefined) ?? '';
        const prevColorMode = this._lastColorModes[id] ?? '';
        const leavingTemp = prevColorMode === 'color_temp' && nextColorMode !== '' && nextColorMode !== 'color_temp';
        if (leavingTemp && this._memberModes[id] === 'temperature') {
          if (!modesPatch) modesPatch = { ...this._memberModes };
          modesPatch[id] = 'brightness';
        }
        if (nextColorMode) this._lastColorModes[id] = nextColorMode;
      }
      if (modesPatch) this._memberModes = modesPatch;
    }
    // Snapshot the live `color_temp_kelvin` per entity (members + group) so
    // the auto-apply on re-entering temp mode (see `_setMemberMode`) has a
    // meaningful value to restore. We capture whenever the light reports a
    // value, not only when it's currently in temp mode.
    if (changed.has('hass')) {
      const idsForSnapshot = [...this.memberIds, this.groupEntityId];
      for (const id of idsForSnapshot) {
        const k = this.hass?.states[id]?.attributes?.color_temp_kelvin as number | undefined;
        if (typeof k === 'number' && k > 0) this._memberLastTemp[id] = k;
      }
    }
    // P7.1: re-sync saved-colors from the configured source on hass updates
    // (e.g. helper input_text state changed externally) and on config swaps.
    if (changed.has('hass') || changed.has('savedColorsConfig')) {
      this._syncSavedColorsFromSource();
    }
    // Stefan-2026-05-11 P15.6-r63g (R306 / PA-0034): bind the group-tile
    // gesture handlers UNCONDITIONALLY on every updated() cycle. The
    // PickerController's bindIcon() is idempotent — when called with the
    // same element it's already bound to, it returns early without
    // re-attaching listeners (picker-controller.ts:224 `el === this._boundEl`).
    // So the cost is one querySelector + one identity check per render —
    // cheap and safe.
    //
    // Why this is the right shape (replaces r63e's brittle `isFreshMount`
    // dance): HA dashboard view-switches may rebuild the inner DOM
    // (`.tile.group`, `.tile.group.compact-target`) WITHOUT firing this
    // component's connectedCallback or disconnectedCallback (the host
    // `<everyday-light-card>` web-component instance survives the switch,
    // only its shadow-DOM subtree is rebuilt by Lit). In that path,
    // `_lastBoundMemberIds` is never cleared, so `isFreshMount` stays
    // false, and the previous gated rebind was skipped. The picker
    // controller's _boundEl still pointed at the destroyed groupTile,
    // and the new groupTile rendered with no handlers — visible as
    // "parent icon doesn't respond after view-switch" (Stefan PA-0032/
    // 0034, "first not hand on hover, other 2 hand but no action").
    //
    // The host card `everyday-light-card.ts` already binds its
    // `.single-icon` / `.parallel-mindmap-icon` unconditionally per
    // updated() (line 564-572) — that's why single-light cards stayed
    // clickable after view-switch while group cards didn't. This change
    // brings the group-layout binding lifecycle into parity.
    this._bindCompactGestures();
    this._bindExpandedGroupGestures();

    // Member-tile picker REBUILD (dispose old controllers, create new
    // ones, refill the Map) is heavier than a group-tile bind and must
    // stay gated to avoid mid-gesture teardown (R145b: long-press detector
    // killed when listeners disposed mid-press). Triggers: memberIds
    // content-changed, compact/expanded toggled, or fresh mount.
    if (changed.has('compact') || changed.has('_compactExpanded') || changed.has('memberIds') || isFreshMount) {
      // Member-tiles only enter the DOM when the expanded view renders.
      // When transitioning compact-collapsed → expanded the memberIds key
      // hasn't changed (so the memberIds-based rebind path doesn't fire),
      // so we'd render the expanded view with NO gesture handlers attached
      // and tap/double-tap/long-press would silently no-op. Force a rebind
      // here whenever the expanded view becomes visible.
      if (this._compactExpanded) {
        this._rebindMemberGestures();
      } else if (changed.get('_compactExpanded') === true) {
        // Compact-expanded just collapsed: reset every member's slider mode
        // back to brightness so the next expand starts clean (Stefan-
        // 2026-05-09). `changed.get('_compactExpanded')` returns the
        // PREVIOUS value, so `=== true` here means "we just transitioned
        // from expanded → collapsed".
        if (Object.keys(this._memberModes).length > 0) {
          this._memberModes = {};
        }
      }
      // Stefan-2026-05-12 PA-0002 (R2a): persist the expansion state to
      // localStorage whenever it changes (or when the entity id changes
      // — covers the case where a card config edit reassigns the group
      // mid-mount). Only persists under sticky-expansion config; no-op
      // for legacy session-only mode. Idempotent: writes the same key
      // on every update so a sticky-toggle flip catches up instantly.
      if (changed.has('_compactExpanded') || changed.has('groupEntityId') || changed.has('expansionSticky')) {
        this._persistExpansionToStorage();
      }
    }
    if (
      changed.has('_wheelTarget') ||
      changed.has('_savedColorsTarget') ||
      changed.has('_effectsTarget') ||
      changed.has('_scenesTarget') ||
      changed.has('_compactExpanded') ||
      changed.has('_topologyPopupOpen') ||
      changed.has('_parallelSlidersTarget')
    ) {
      // While any host-managed popup is open (wheel/saved/topology/parallel),
      // install a document-level listener that closes the popup on any click
      // outside. Picker overlays themselves are managed by their own
      // PickerController instances which install their own listeners.
      if (
        this._wheelTarget !== null ||
        this._savedColorsTarget !== null ||
        this._effectsTarget !== null ||
        this._scenesTarget !== null ||
        this._compactExpanded ||
        this._topologyPopupOpen ||
        this._parallelSlidersTarget !== null
      ) {
        this._installOutsideClickListener();
      } else {
        this._removeOutsideClickListener();
      }
    }
    // Re-render the body-portal popups whenever any of their inputs change.
    // Stefan-2026-05-09 P41 R10 + P43 R20/R21: portal hosts wheel +
    // saved-colors + topology + parallel-sliders popups, all outside the
    // shadow root so HA's transform-ancestor doesn't break position:fixed.
    if (
      changed.has('_wheelTarget') ||
      changed.has('_savedColorsTarget') ||
      changed.has('_effectsTarget') ||
      changed.has('_scenesTarget') ||
      changed.has('_scenesEditMode') ||
      changed.has('_scenesPopupActiveOrder') ||
      changed.has('_topologyPopupOpen') ||
      changed.has('_parallelSlidersTarget') ||
      changed.has('_parallelPopupOrigin') ||
      changed.has('_popupOrigin') ||
      changed.has('_savedColors') ||
      changed.has('_savedColorsEditing') ||
      changed.has('_memberModes') ||
      changed.has('hass') ||
      changed.has('wheelType') ||
      changed.has('wheelHues') ||
      changed.has('wheelRings') ||
      changed.has('memberIds')
    ) {
      this._renderPopupPortal();
    }
    // Stefan-2026-05-11 R260: rebind ResizeObserver to current
    // .member-col elements after every render — Lit may have replaced
    // them, especially after memberIds changes or compact↔expanded
    // toggles. Observe each col with its data-entity attribute so the
    // RO callback can map back to entity_id → _memberColHeights.
    this._reobserveMemberCols();
    // Stefan-2026-05-11 R277 (PA-13 Issue 3): in addition to the col-height
    // observer, also direct-measure each NESTED-member's actual group-icon
    // Y position by traversing the embedded card's shadow DOM. This is
    // robust to label-wrap (1 vs 2 lines), padding changes, or any other
    // intra-card layout shift that breaks the hardcoded colHeight-41 formula
    // Stefan PA-13 flagged "Back→Bathroom dot ist nicht aligned mit dem
    // bathroom icon" returned at r60 (R271 stretch changed embedded
    // widths → labels redistributed → the offset formula was off).
    this._measureNestedIconYs();
  }

  /**
   * Stefan-2026-05-11 R277: per-render direct measurement of each nested
   * member's group-icon Y position. Walks each `.member-col[data-entity]`,
   * descends into the embedded `<everyday-light-card>` shadowRoot, then
   * into the inner `<everyday-group-layout-expanded>` shadowRoot, locates
   * the `.tile.group .ic` element, and computes its center-Y relative to
   * the outer `.member-cols` top. Stored on `_measuredMemberIconYs` and
   * preferred over the offset formula in `_renderTopologyTree`.
   *
   * Stays no-op when the embedded card hasn't finished rendering yet —
   * the offset formula provides a stable fallback during the initial
   * paint flicker.
   */
  private _measureNestedIconYs(): void {
    const memberCols = this.shadowRoot?.querySelector('.member-cols');
    if (!memberCols) return;
    const memberColsTop = memberCols.getBoundingClientRect().top;
    let changed = false;
    const cols = this.shadowRoot?.querySelectorAll<HTMLElement>(
      '.member-col[data-entity]',
    );
    if (!cols) return;
    for (const col of cols) {
      const entityId = col.getAttribute('data-entity');
      if (!entityId) continue;
      const isNested = this.memberConfigs.has(entityId);
      let iconEl: HTMLElement | null = null;
      if (isNested) {
        const childCard = col.querySelector('everyday-light-card');
        const innerGroup = childCard?.shadowRoot?.querySelector(
          'everyday-group-layout-expanded',
        );
        // Prefer the compact-target icon when the embedded card is in
        // compact mode (.tile.group.compact-target). Fall back to the
        // expanded-tile (.topology .tile.group). Either way it's a 46×46
        // .ic whose centre is the mindmap-dot anchor.
        iconEl =
          innerGroup?.shadowRoot?.querySelector<HTMLElement>(
            '.tile.group.compact-target .ic',
          )
          ?? innerGroup?.shadowRoot?.querySelector<HTMLElement>(
            '.topology .tile.group .ic',
          )
          // Stefan-2026-05-12 R329 (PA-0008): nested member configured with
          // `default_view_mode: parallel` doesn't render a group-layout-
          // expanded child — the parallel-inline render path lives directly
          // in the embedded everyday-light-card's own shadow root. Fall
          // through to the parallel-icon variants so the parent's mindmap
          // arm anchors to the actual icon position instead of the col-
          // center fallback. `.parallel-compact-icon` is R327's compact
          // variant; `.parallel-mindmap-icon` is the standard layout.
          ?? childCard?.shadowRoot?.querySelector<HTMLElement>(
            '.parallel-compact-icon',
          )
          ?? childCard?.shadowRoot?.querySelector<HTMLElement>(
            '.parallel-mindmap-icon',
          )
          // Stefan-2026-05-12 R329 (PA-0008): also handle the bare single-
          // light embedded path (no parallel, no group). Anchors to
          // `.single-icon` for completeness.
          ?? childCard?.shadowRoot?.querySelector<HTMLElement>(
            '.single-icon',
          )
          ?? null;
      } else {
        // Stefan-2026-05-11 R293 (PA-14): also direct-measure bare leaf
        // members. The previous BARE_ICON_BOTTOM_OFFSET=35 formula was
        // ~5 px off in practice (label line-height drift + flex-gap
        // precision), leaving bare-member dots visibly below their icon
        // centers. Stefan PA-14: "the dots for hall door for instance
        // need to sit a bit higher". Direct getBoundingClientRect on
        // `.tile.member .ic` gives the exact icon-center every time;
        // the formula stays as a defensive fallback when DOM isn't
        // ready yet (first paint).
        iconEl = col.querySelector<HTMLElement>('.tile.member .ic')
          ?? col.querySelector<HTMLElement>('.tile .ic');
      }
      if (!iconEl) continue;
      const iconRect = iconEl.getBoundingClientRect();
      if (iconRect.height <= 0) continue;
      const iconCenterY = iconRect.top + iconRect.height / 2 - memberColsTop;
      const rounded = Math.round(iconCenterY);
      if (this._measuredMemberIconYs.get(entityId) !== rounded) {
        this._measuredMemberIconYs.set(entityId, rounded);
        changed = true;
      }
    }
    // Prune entries for entities no longer rendered.
    for (const id of this._measuredMemberIconYs.keys()) {
      if (!this.memberIds.includes(id)) {
        this._measuredMemberIconYs.delete(id);
        changed = true;
      }
    }
    if (changed) this.requestUpdate();
  }
  /** Stefan-2026-05-11 R277: direct-measured icon-center Y per entity-id,
   *  relative to .member-cols top. Populated by `_measureNestedIconYs()`
   *  in `updated()`; consumed by `_renderTopologyTree()` when building
   *  the `memberYs` prop. */
  private _measuredMemberIconYs = new Map<string, number>();

  /**
   * Stefan-2026-05-11 R260: re-attach ResizeObserver to current DOM
   * .member-col elements. Called from `updated()`. Disconnects stale
   * elements (compares against `_observedMemberCols` set) and observes
   * any new ones. Also prunes _memberColHeights entries for entities
   * no longer in memberIds.
   */
  private _reobserveMemberCols(): void {
    if (!this._memberColRO) return;
    const cols = this.shadowRoot?.querySelectorAll('.member-col');
    if (!cols) return;
    const currentSet = new Set<Element>(cols);
    // Unobserve stale elements
    for (const old of this._observedMemberCols) {
      if (!currentSet.has(old)) this._memberColRO.unobserve(old);
    }
    // Observe new elements
    for (const col of currentSet) {
      if (!this._observedMemberCols.has(col)) this._memberColRO.observe(col);
    }
    this._observedMemberCols = currentSet;
    // Prune heights for entities no longer rendered
    const liveIds = new Set(this.memberIds);
    for (const id of this._memberColHeights.keys()) {
      if (!liveIds.has(id)) this._memberColHeights.delete(id);
    }
    // Stefan-2026-05-12 R299 (PA-0041): also (re-)bind the gap-observer
    // to the parent `.member-cols` container. If Lit has replaced the
    // element since the last updated() (e.g. memberIds changed forced a
    // re-keyed render), unobserve the stale one and pick up the new ref.
    // Sync to the same lifecycle pass so width-tracking + col-height-
    // tracking always agree on which DOM tree is live.
    if (this._memberColsRO) {
      const memberColsEl = this.shadowRoot?.querySelector('.member-cols') ?? null;
      if (memberColsEl !== this._observedMemberColsEl) {
        if (this._observedMemberColsEl) {
          this._memberColsRO.unobserve(this._observedMemberColsEl);
        }
        if (memberColsEl) {
          this._memberColsRO.observe(memberColsEl);
          // Initial measurement: schedule a recompute so the first paint
          // can replace the depth-static fallback with the measured gap.
          this._scheduleGapRecompute();
        }
        this._observedMemberColsEl = memberColsEl;
      }
    }
  }

  /**
   * Stefan-2026-05-12 R299 (PA-0041) + R319-R322 (PA-0044): rAF-coalesced
   * gap + slider-width recompute. ResizeObserver fires frequently during
   * animations / drags / window resize / child compact↔expanded; collapse
   * to one measurement-per-frame to avoid layout thrash.
   *
   * Per Stefan-Spec PA-0044 priority: gaps shrink first, slider-width
   * second. Both fall out of `resolveOverflow`:
   *   - No overflow → R299 base gap, no slider override.
   *   - Overflow with gap-shrink-room → reduced gap, no slider override.
   *   - Overflow with gap-at-floor → floor gap + local slider override
   *     applied as inline `--everyday-slider-width` on `.layout`.
   *
   * 0.5 px dedup on both values to avoid infinite RO ↔ re-render loops
   * when our own inline-style flip-flops the layout by sub-px fractions.
   * Baseline slider width is read from `getComputedStyle(this)` (the
   * host element), which gives us the PARENT'S cascaded value before
   * any local override on our `.layout`. That makes the algorithm
   * self-stabilizing: if the container grows enough, the override
   * naturally drops back to `undefined`.
   */
  private _scheduleGapRecompute(): void {
    if (this._gapRecomputeRaf) return;
    this._gapRecomputeRaf = requestAnimationFrame(() => {
      this._gapRecomputeRaf = 0;
      const el = this._observedMemberColsEl as HTMLElement | null;
      const width = el?.clientWidth ?? 0;
      const childCount = el?.children.length ?? 0;
      // Baseline slider width = parent's cascaded `--everyday-slider-width`.
      // Read on the host (NOT on `.layout`) so any local override we've
      // applied on our own `.layout` is ignored — we're computing what
      // the natural cascade would deliver if we removed our override.
      const baselineCss = getComputedStyle(this).getPropertyValue('--everyday-slider-width').trim();
      const baselineSliderWidth = parseFloat(baselineCss) || 60;
      const resolved = resolveOverflow({
        depth: this.depth,
        containerWidth: width,
        childCount,
        baselineSliderWidth,
      });
      const prevGap = this._computedMemberColsGap;
      const prevOverride = this._computedSliderWidthOverride;
      const gapChanged = prevGap === undefined
        || Math.abs(prevGap - resolved.gap) >= 0.5;
      const overrideChanged = (prevOverride ?? -1) !== (resolved.sliderOverride ?? -1)
        && (prevOverride === undefined
          || resolved.sliderOverride === undefined
          || Math.abs((prevOverride ?? 0) - (resolved.sliderOverride ?? 0)) >= 0.5);
      if (gapChanged) this._computedMemberColsGap = resolved.gap;
      if (overrideChanged) this._computedSliderWidthOverride = resolved.sliderOverride;
      if (gapChanged || overrideChanged) this.requestUpdate();
      // Stefan-2026-05-12 R349 (PA-0019): broadcast this card's slider-width
      // need so siblings + ancestors can adopt the smallest one for visual
      // uniformity. We always fire (not just on change) because a sibling
      // may have just connected and missed the change-edge. Detail.width is
      // the SMALLEST width that fits THIS card's content with floor-gap; if
      // resolveOverflow returned no override, the baseline already fits so
      // we report the baseline (= 60 in the common case). Non-bubbling
      // listener at the parent level catches this without leaking past the
      // top-level card. composed: true is required to cross shadow roots
      // (each embedded card has its own shadow root).
      const ownNeed = resolved.sliderOverride ?? baselineSliderWidth;
      if (this.groupEntityId) {
        this.dispatchEvent(new CustomEvent('slider-width-need', {
          detail: { entity: this.groupEntityId, width: ownNeed },
          bubbles: true,
          composed: true,
        }));
      }
    });
  }

  /**
   * Stefan-2026-05-13 R352 (PA-0020): listener for embedded children's
   * `nested-layout-change` events. Re-measure icon Y positions
   * synchronously so the parent's mindmap arm catches up to the child's
   * new layout in the SAME frame as the child's re-render — instead of
   * waiting for the per-col ResizeObserver which fires async (1-2 frames
   * late) and sometimes not at all when col-height delta is sub-pixel.
   *
   * Stefan-Quote PA-0020: "the mindmap node, dot and arm for Hall takes
   * some time to find its place (the mindmap adjustment isnt instant)".
   *
   * Schedule TWO re-measures: one immediately (catches the post-toggle
   * state if Lit synchronously committed) and one after a microtask
   * (catches the more-likely case where Lit's batching defers the DOM
   * commit by one tick). The double-call is cheap (just rect reads) and
   * idempotent (the changed-check inside `_measureNestedIconYs` skips
   * redundant updates).
   */
  private _onNestedLayoutChange = (_ev: Event): void => {
    // Don't recompute for our own children if we don't track them
    if (!this.memberConfigs || this.memberConfigs.size === 0) return;
    this._measureNestedIconYs();
    // Defer one tick so the embedded child's re-render is committed
    // before we read its bounding-rect again.
    queueMicrotask(() => this._measureNestedIconYs());
    // Belt-and-suspenders: also schedule on next animation frame to
    // catch the post-layout-paint state when CSS transitions are involved.
    requestAnimationFrame(() => this._measureNestedIconYs());
  };

  /**
   * Stefan-2026-05-12 R349 (PA-0019): listener for descendant cards'
   * `slider-width-need` events. Tracks per-child need in
   * `_childSliderNeeds`, recomputes global min, and applies as
   * `_childMinSliderNeed` (consumed in `effectiveSliderWidth` at render).
   * The min cascades down via `--everyday-slider-width` so all branches
   * of this sub-tree converge to the bottleneck child's width — fixes
   * the "bathroom shrinks but hall doesn't" asymmetry.
   *
   * Skip own events (composed:true bubbling reaches even the originating
   * element). Drop child-needs that report >= 60 from the min calc since
   * those don't constrain anything (60 is the universal default; a child
   * reporting it isn't asking for anything narrower).
   */
  private _onChildSliderNeed = (ev: Event): void => {
    const detail = (ev as CustomEvent).detail as { entity?: string; width?: number } | undefined;
    if (!detail || !detail.entity || typeof detail.width !== 'number') return;
    if (detail.entity === this.groupEntityId) return;
    const prev = this._childSliderNeeds.get(detail.entity);
    if (prev !== undefined && Math.abs(prev - detail.width) < 0.5) return;
    this._childSliderNeeds.set(detail.entity, detail.width);
    // Recompute global min across ALL tracked descendants.
    let min: number | undefined;
    for (const w of this._childSliderNeeds.values()) {
      if (w < 60 && (min === undefined || w < min)) min = w;
    }
    if (min !== this._childMinSliderNeed) {
      this._childMinSliderNeed = min;
      this.requestUpdate();
    }
  };

  /**
   * Render the body-portal popups imperatively. Up to FOUR popup types
   * coexist in the same portal (only one of each visible at a time):
   *   .inplace-popup.wheel    Color-wheel (P6, anchored to picker dot)
   *   .inplace-popup.saved    Saved-colors (P7, anchored to picker dot)
   *   .topology-popup         Full N-slider topology view (P43 R21,
   *                           centred modal — replaces inline-expand)
   *   .parallel-popup         Multi-axis parallel sliders for one entity
   *                           (P43 R20, centred modal)
   */
  private _renderPopupPortal(): void {
    if (!this._popupPortal) return;
    const x = this._popupOrigin?.x ?? 0;
    const y = this._popupOrigin?.y ?? 0;
    const tpl = html`
      ${this._wheelTarget && this._popupOrigin
        ? html`
            <div
              class="inplace-popup wheel"
              style=${`left: ${x}px; top: ${y}px;`}
              @click=${(ev: Event) => ev.stopPropagation()}
            >
              <everyday-color-wheel
                .wheelType=${this.wheelType}
                .hues=${this.wheelHues}
                .rings=${this.wheelRings}
                @color-pick=${this._onColorPick}
              ></everyday-color-wheel>
            </div>
          `
        : null}
      ${this._savedColorsTarget && this._popupOrigin
        ? html`
            <div
              class="inplace-popup saved"
              style=${`left: ${x}px; top: ${y}px;`}
              @click=${(ev: Event) => ev.stopPropagation()}
            >
              <everyday-saved-colors-picker
                .colors=${this._savedColors}
                .editMode=${this._savedColorsEditing}
                @color-pick=${this._onSavedColorPick}
                @enter-edit=${this._onSavedEnterEdit}
                @remove-color=${this._onSavedRemove}
                @add-current=${this._onSavedAddCurrent}
              ></everyday-saved-colors-picker>
            </div>
          `
        : null}
      ${this._topologyPopupOpen
        ? this._renderTopologyPopup()
        : null}
      ${this._parallelSlidersTarget
        ? this._renderParallelSlidersPopup()
        : null}
      ${this._effectsTarget && this._popupOrigin
        ? (() => {
            const fullList =
              (this.hass?.states[this._effectsTarget]?.attributes
                ?.effect_list as string[] | undefined) ?? [];
            // Stefan-2026-05-10 P15.6-r45 (R217): when the user has trimmed
            // the active order via long-press → delete, fall back to the
            // trimmed order; otherwise show the full effect_list.
            const activeOrder =
              this._effectsPopupActiveOrder.length > 0
                ? this._effectsPopupActiveOrder
                : fullList;
            return html`
              <div
                class="inplace-popup effects"
                style=${`left: ${x}px; top: ${y}px; max-width: 320px; max-height: 60vh;`}
                @click=${(ev: Event) => ev.stopPropagation()}
              >
                <div
                  style="display:flex; justify-content:space-between; align-items:center; margin: 0 0 8px; padding: 0 4px;"
                >
                  <span
                    style="font-size: 13px; font-weight: 500; color: var(--primary-text-color, #fff); opacity: 0.9;"
                    >Effects${this._effectsEditMode ? ' · edit' : ''}</span
                  >
                  ${this._effectsEditMode
                    ? html`<button
                        type="button"
                        style="border: none; background: transparent; color: var(--primary-color, #03a9f4); font-size: 12px; cursor: pointer; padding: 2px 6px;"
                        @click=${this._onEffectsExitEdit}
                      >
                        Done
                      </button>`
                    : null}
                </div>
                <everyday-effects-list-picker
                  .effects=${fullList}
                  .activeOrder=${activeOrder}
                  .editMode=${this._effectsEditMode}
                  .editable=${this.effectsEditable}
                  .longPressMs=${this.longPressMs}
                  @effect-pick=${this._onEffectPick}
                  @enter-edit=${this._onEffectsEnterEdit}
                  @delete-effect=${this._onEffectsDelete}
                  @restore-effect=${this._onEffectsRestore}
                  @exit-edit=${this._onEffectsExitEdit}
                ></everyday-effects-list-picker>
              </div>
            `;
          })()
        : null}
      ${this._scenesTarget && this._popupOrigin
        ? (() => {
            // Stefan-2026-05-16 PA-0001 (scenes_list): render the scenes-
            // list-picker into the body-portal, anchored at the captured
            // icon origin. discoverScenesForEntity intersects every
            // `scene.*` with the target's leaves (or with the explicit
            // `scenes_picker.scenes` override). Empty discovery silently
            // no-ops the popup so misconfigured cards don't show a blank
            // surface.
            const scenes = discoverScenesForEntity(
              this.hass,
              this._scenesTarget,
              {
                override: this.scenesPickerConfig?.scenes,
                stripPrefix: this.scenesPickerConfig?.name_strip_prefix !== false,
              },
            );
            if (scenes.length === 0) {
              this._scenesTarget = null;
              return null;
            }
            // Stefan-2026-05-16 PA-0005: pre-compute the active-order
            // for this popup-target. When the user has trimmed the
            // active list via long-press-delete, fall back to the
            // trimmed order; otherwise use every discovered scene id
            // (default-populate). Mirrors the effects-list popup R217.
            const fullSceneIds = scenes.map((s) => s.id);
            const sceneActiveOrder = this._scenesPopupActiveOrder.length > 0
              ? this._scenesPopupActiveOrder
              : fullSceneIds;
            return html`
              <div
                class="inplace-popup scenes"
                style=${`left: ${x}px; top: ${y}px; max-width: 320px; max-height: 60vh;`}
                @click=${(ev: Event) => ev.stopPropagation()}
              >
                <div
                  style="display:flex; justify-content:space-between; align-items:center; margin: 0 0 8px; padding: 0 4px;"
                >
                  <span
                    style="font-size: 13px; font-weight: 500; color: var(--primary-text-color, #fff); opacity: 0.9;"
                    >Scenes${this._scenesEditMode ? ' · edit' : ''}</span
                  >
                  ${this._scenesEditMode
                    ? html`<button
                        type="button"
                        style="border: none; background: transparent; color: var(--primary-color, #03a9f4); font-size: 12px; cursor: pointer; padding: 2px 6px;"
                        @click=${this._onScenesExitEdit}
                      >
                        Done
                      </button>`
                    : null}
                </div>
                <everyday-scenes-list-picker
                  .scenes=${scenes}
                  .activeOrder=${sceneActiveOrder}
                  .editMode=${this._scenesEditMode}
                  .editable=${this.scenesPickerConfig?.editable !== false}
                  .longPressMs=${this.longPressMs}
                  @scene-pick=${this._onScenePick}
                  @delete-scene=${this._onSceneDelete}
                  @restore-scene=${this._onSceneRestore}
                  @enter-edit=${this._onScenesEnterEdit}
                  @exit-edit=${this._onScenesExitEdit}
                ></everyday-scenes-list-picker>
              </div>
            `;
          })()
        : null}
    `;
    render(tpl, this._popupPortal);

    // Stefan-2026-05-09 P47 R29: bind gesture-handlers on tiles inside the
    // body-portal. The shadow-root @queryAll('.tile.member') only finds
    // tiles in this component's shadow DOM — portal tiles live in the
    // document tree and need a separate bind pass. We also disable the
    // shadow-root tile-bindings while the topology-popup is open, since
    // those tiles are visibility:hidden via the popup-hidden class and
    // shouldn't accept gestures.
    if (this._topologyPopupOpen) {
      this._bindPortalTopologyGestures();
    } else {
      // Topology popup closed → disposable cleanups for any portal-tile
      // gestures that were active. They're stored under entity-id keys
      // PREFIXED with `portal:` to keep them separate from shadow-tile
      // cleanups.
      this._teardownPortalGestures();
    }
  }

  /**
   * Bind member-picker controllers to the topology-popup's portal tiles
   * (Stefan-2026-05-10 P15.6). When the popup is open, the SAME
   * `_memberPickers` controllers swap their gesture binding from the
   * shadow-root tile (`bindIcon(shadowEl)`) to the body-portal tile
   * (`bindIcon(portalEl)`). Shadow tiles are visibility:hidden while the
   * popup is up, so re-using one controller per entity is safe — only one
   * tile is interactive at a time. When the popup closes,
   * `_teardownPortalGestures` rebinds back to shadow tiles.
   *
   * `[data-portal-bound]` flag prevents re-binding on every popup re-render
   * — bindIcon would dispose+rebind the listeners, losing in-flight
   * press-drag-select state. Skipping already-bound tiles preserves the
   * gesture across renders.
   */
  private _bindPortalTopologyGestures(): void {
    if (!this._popupPortal) return;
    const tiles = this._popupPortal.querySelectorAll(
      '.topology-popup .tile.member[data-entity]:not([data-portal-bound])',
    ) as NodeListOf<HTMLElement>;
    tiles.forEach((el) => {
      const id = el.dataset.entity;
      if (!id) return;
      el.dataset.portalBound = '1';
      this._memberPickers.get(id)?.bindIcon(el);
    });
  }

  /**
   * Topology-popup just closed. Rebind every member-picker controller to
   * its shadow-root tile (which becomes visible again). The portal tiles
   * are about to leave the DOM as lit re-renders the empty popup template.
   * Their listeners were already removed by the controllers' bindIcon
   * dispose path during this rebind.
   */
  private _teardownPortalGestures(): void {
    if (this._popupPortal) {
      const boundTiles = this._popupPortal.querySelectorAll('[data-portal-bound]');
      boundTiles.forEach((el) => (el as HTMLElement).removeAttribute('data-portal-bound'));
    }
    this._rebindMemberGestures();
  }

  /**
   * Topology popup content (Stefan-2026-05-09 P44 R23 — re-fix of P43 R21).
   * Renders the SAME topology structure as the inline-expand view (mindmap
   * baum as bg, member-cols above tiles, group-row), so members appear at
   * the same positions visually. Only slider height differs based on the
   * `full_length_sliders` config:
   *   default false → member sliders 170 px (mindmap-baum has room).
   *   true          → member sliders 260 px (matches host).
   *
   * The popup mounts into the body-portal so HA's transform-ancestor
   * doesn't break position:fixed (P41 lesson).
   */
  private _renderTopologyPopup(): TemplateResult {
    if (!this.hass || !this.groupEntityId || this.memberIds.length === 0) {
      return html``;
    }
    if (!this._topologyAnchorRect) return html``;

    // Stefan-2026-05-09 P46 R27+R28b: popup uses position:absolute with
    // document coordinates (rect + window.scrollY/X) so it SCROLLS WITH
    // THE PAGE — not stuck at a fixed viewport pixel. The translateY(-100%)
    // trick anchors the popup's BOTTOM-edge at the document-y of the
    // original card's bottom, so the host group-icon (which sits at the
    // bottom of the inline-expand layout via justify-content: flex-end)
    // ends up at the same on-screen y as the original card's group-icon.
    // When member-cols + topology-gap add height, the popup grows UPWARD
    // because translateY pulls it up by its own (now larger) height.
    const r = this._topologyAnchorRect;
    const popupStyle = [
      'position: absolute',
      `left: ${r.left + window.scrollX}px`,
      // top = doc-y of the original card's BOTTOM. translateY(-100%)
      // shifts the popup up by its own height so its bottom-edge
      // sits exactly at this y. Result: card's group-icon-y is the
      // anchor (Stefan: "Da wie gesagt ist das main Node Icon der Anker").
      `top: ${r.bottom + window.scrollY}px`,
      `width: ${r.width}px`,
      `min-height: ${r.height}px`,
      'transform: translateY(-100%)',
    ].join('; ');

    // Stefan-2026-05-12 PA-0002: full_length 260 → 270 to track new
    // universal default. Equal to the default now, kept for back-compat.
    const sliderHeightOverride = this.fullLengthSliders
      ? `--everyday-slider-height: 270px;`
      : '';

    return html`
      <div
        class="topology-popup anchored"
        style=${popupStyle}
        @click=${(ev: Event) => ev.stopPropagation()}
      >
        <div class="popup-card topology-popup-card anchored-card" style=${sliderHeightOverride}>
          ${this._renderTopologyTree()}
        </div>
      </div>
    `;
  }

  /**
   * Topology tree (mindmap-bg + member-cols + group-row) — extracted helper
   * used by BOTH the inline-expand view AND the topology-popup. Duplicating
   * this between the two render paths was the bug Stefan flagged in R23
   * ("das Popup soll schon so aussehen, wie der Inline expand vorher") —
   * a single source of truth ensures pixel-perfect parity.
   *
   * Caller wraps it inside whatever container they prefer (.layout for
   * inline, .popup-topology-tree for popup) plus their own padding/header.
   */
  /**
   * Resolve the icon name for a given entity. Reads from
   * `attributes.icon` (HA entity-registry icon, e.g. user-customised
   * `mdi:track-light` for `light.hall_spots`) first, then falls back
   * through the per-component overrides and finally a sensible default.
   * Stefan-2026-05-10 R150 — Cards 4/5/6a previously rendered all members
   * with the shared `memberIcon` override (or `mdi:lightbulb` fallback),
   * losing entity-specific icons that show correctly on Card 6b.
   */
  private _entityIcon(entityId: string, fallback: string, override?: string): string {
    return resolveEntityIcon(this.hass, entityId, fallback, override);
  }

  private _renderTopologyTree(): TemplateResult {
    const n = this.memberIds.length;
    const groupOn = this._isGroupOn();
    // Per-member icon resolution — each member can show its own
    // entity-icon (Stefan-2026-05-10 R150). The `memberIconName` prop
    // only takes effect when an entity has no `attributes.icon`.
    // Stefan-2026-05-11 R275 (PA-13 Issue 6): groupIcon goes through
    // _groupIcon() (override > state > fallback) so config.icon wins.
    const groupIcon = this._groupIcon('mdi:ceiling-light');

    // Stefan-2026-05-10 R166 + R182: full_length_sliders is a simple
    // two-state toggle. Both compact-collapsed-then-expanded AND always-
    // expanded configs render IDENTICALLY. Stefan-Quote: "diese beiden
    // konfigurationen müssen genau gleich aussehen". Walks back the
    // r17–r23 attempts to align compact-expanded slider top with where
    // the compact slider top was (R171/R173/R177-1) — canonical expanded
    // layout wins over compact-reference matching.
    //   true  → 260 px sliders (matches compact slider length)
    //   false → 220 px sliders (R184: default 170 was too short. Stefan
    //           wants false-mode expanded sliders LONGER so they reach
    //           closer to the top of the card. Applies to both compact-
    //           then-expanded AND always-expanded uniformly per R182.)
    // Stefan-2026-05-11 P15.6-r63d (R300c / PA-0031): NEW `expand_in_place`
    // option. When true AND the card is compact AND inline-expanded, shrink
    // the expanded slider so the total card-height matches the pre-expand
    // compact card-height (group-icon Y-from-top stays constant). Empirical
    // overhead ~120 px (mindmap-bg + member-tile + group-row + gaps). User
    // can still override via explicit `slider.height` config.
    //
    // Stefan-2026-05-12 PA-0002: expand_in_place base bumped 220 → 270
    // (so when fixed-card-size is on + compact + expanded, the children
    // are 270 - 120 = 150 px instead of 100 px). Stefan-Quote: "the
    // sliders that appear will be shorter in length because the child
    // icons and the mindmap will take some space as well" — 150 px is
    // a more usable shortening than 100 px and tracks the new universal
    // 270 default. full_length:true case 260 → 270 (semantic: "match
    // host"; new host default is 270).
    //
    // Stefan-2026-05-12 R346 (PA-0018): default bumped 220 → 270 to match
    // single-light + parallel-inline (every other render path uses 270 as
    // the universal default after PA-0002). Stefan-Quote PA-0018: "die
    // slider hier müssen auch alle die volle länge haben wie es auch bei
    // dieser config der fall ist [single-light]". The R184-era 220 default
    // was a "shorter than host to leave mindmap room" compromise that's no
    // longer wanted — Stefan wants visual parity with single-light cards.
    // `full_length_sliders` flag still reads 270 (kept as backwards-compat
    // no-op alias). `expand_in_place + compact + _compactExpanded` chain
    // unchanged (still 150 px so the card stays the pre-expand height).
    // Resolution priority:
    //   1. explicit this.sliderHeight prop wins (user override)
    //   2. expandInPlace + compact + _compactExpanded → 270 - 77 = 193 px
    //   3. otherwise → 270 px (universal default since R346)
    //
    // Stefan-2026-05-13 R360 (PA-0021): OVERHEAD revised 120 → 77. The
    // 120 number was a fudge factor that left both the slider-top and the
    // group-icon-Y misaligned between compact and expanded modes — total
    // expanded card was ~43 px shorter than compact, so `min-height: 380`
    // + `justify-content: flex-end` pushed expanded content downward by
    // 89 px on hall_spots (3 members) to fill the reserved space.
    // Stefan-Quote PA-0021: "in expanded view the sliders top must at the
    // same level as the collapsed sliders. here they are way below it.
    // also the same issue with the icon alignment as with the parallel
    // sliders".
    //
    // Derivation (R360):
    //   compact total      = pad_top + sliderH_comp + gap_comp + tile.group + pad_bot
    //                      = 24 + 270 + 12 + 69 + 24                          = 399
    //   compact icon-Y     = pad_top + sliderH_comp + gap_comp + half_icon
    //                      = 24 + 270 + 12 + 23                               = 329
    //   expanded total     = pad_top + (sliderH_exp + member_col_gap + tile.member
    //                                  + topology_gap + tile.group) + pad_bot
    //                      = 24 + sliderH_exp + 8 + 57 + 24 + 69 + 24         = sliderH_exp + 206
    //   expanded icon-Y    = pad_top + sliderH_exp + 8 + 57 + 24 + half_icon
    //                      = 24 + sliderH_exp + 89 + 23                       = sliderH_exp + 136
    //   set total match    →  sliderH_exp = 399 - 206 = 193
    //   set icon-Y match   →  sliderH_exp = 329 - 136 = 193
    // Both invariants resolve to the same target (193). OVERHEAD = 270 - 193 = 77.
    // tile.member heights derive from `.tile.member { ic 34, gap 4, lbl 19 }`
    // in group-layout-expanded.styles.ts:343-394; tile.group from `.tile.group
    // .ic { 46x46 }` + gap-4 + lbl-19. If those CSS values change, this
    // OVERHEAD has to recompute.
    const EXPAND_IN_PLACE_TOPOLOGY_OVERHEAD = 77;
    const isInlineExpandedCompact = this.compact && this._compactExpanded;
    const effectiveSliderHeight = this.sliderHeight
      ?? (this.expandInPlace && isInlineExpandedCompact
        ? Math.max(80, 270 - EXPAND_IN_PLACE_TOPOLOGY_OVERHEAD)
        : 270);

    // Stefan-2026-05-11 R254: standalone non-nested layouts have a
    // calibrated min-height (~380 px) where the icons land at known
    // SVG coords (288/195 + sliderDelta empirically tuned by Stefan
    // over many iterations). Restore those for the truly-standalone
    // path so non-nested views (groups / master / etc) stay pixel-
    // perfect. For cards that are EMBEDDED *or* have NESTED MEMBERS,
    // drop the overrides and let mindmap-path use its iconPosition-
    // aware ResizeObserver responsive defaults — both cases have
    // variable height, so absolute SVG coords drift.
    const sliderDelta = (effectiveSliderHeight ?? 170) - 170;
    const isTop = this.iconPosition === 'top';
    // Stefan-2026-05-12 R348 (PA-0018): GROUP_DOT_Y base 288 → 282 to fix
    // a persistent 6 px misalignment between the SVG group-dot and the
    // HTML group-icon center on standalone (non-nested, non-embedded)
    // group cards. Stefan-Quote PA-0018: "Main icon and mindmap-dot are
    // still not visually aligned. If anything it is worse now". Empirical
    // measurement on /ed-slider/main via Chrome MCP getBoundingClientRect:
    // .tile.group height = 69 px (.ic 46 + gap 4 + .lbl ~19), so
    // .ic-CENTER from .topology-bottom = 46, but the formula was placing
    // the SVG dot at 40 from .topology-bottom (288 + 100 sliderDelta = 388
    // in SVG coords, with topology-height ~428 → 428 − 388 = 40 from bot).
    // The 6-px gap was constant across slider heights (icon and dot moved
    // in lock-step but the dot was always 6 px below the icon). 282 puts
    // the dot at 46 from topology-bottom, matching the icon-center exactly.
    // PA-0017 R343/R345 changed `group-icon-offset` from 46 → 41 → 46 but
    // those edits have NO effect on this codepath because `useResponsive
    // Coords` is false for non-nested cards — `groupYOverride = GROUP_
    // DOT_Y` (hardcoded) wins over `_H - groupIconOffset` (responsive).
    const GROUP_DOT_Y = isTop ? 30 : (282 + sliderDelta);
    const MEMBER_ICON_CENTER_Y = isTop ? (92 + sliderDelta) : (195 + sliderDelta);
    // Stefan-2026-05-12 P15.6 R299 (PA-0041): TILE_GRID_GAP threads the
    // SAME value as the visual --member-cols-gap so mindmap arms stay
    // anchored to col-centers. Pre-R299 (r63a R292): depth-static
    // ternary 28/14/8/4 px. Post-R299: prefer the ResizeObserver-
    // measured value `_computedMemberColsGap`, falling back to the
    // depth-static absolute (which matches both the CSS
    // `:host([depth=N])` rule AND the pre-first-measurement initial
    // paint, so the mindmap geometry is consistent with whatever the
    // browser is currently showing). The depth is clamped into the
    // GAP_MAX_BY_DEPTH range so out-of-spec deep nests stay sane.
    const clampedDepth = Math.max(
      0,
      Math.min(GAP_MAX_BY_DEPTH.length - 1, Math.floor(this.depth)),
    );
    const TILE_GRID_GAP = this._computedMemberColsGap
      ?? GAP_MAX_BY_DEPTH[clampedDepth];
    const hasNestedMembers = this.memberConfigs.size > 0;
    const useResponsiveCoords = this.embedded || hasNestedMembers;
    // Stefan-2026-05-10 P15.6-r41/r43 (R207 + R213b): when card has many
    // members, the member-cols grid (`repeat(N, 1fr)`) compresses each
    // column tightly and sliders + mindmap-arms get cramped. Stefan-Quote:
    // "we restrict the width of the card too much but the slider width
    // tries to stay the same (makes no sense)". Resolve by SHRINKING
    // --everyday-slider-width as N grows: 47 px for N≤5, steeper slope
    // beyond — n=6 → 41, n=7 → 35, n=8 → 29, n=9+ → 28 (touch-target
    // floor). r41 used a -4 px slope which Stefan flagged as too subtle
    // ("nicht dünner") — r43 bumps to -6 px so the shrink is visible.
    // User's explicit `slider.width` config still wins. Mindmap-arms
    // scale automatically since they read --everyday-slider-width via
    // mindmap-path's CSS.
    // Stefan-2026-05-11 R264: when this card is embedded as a nested
    // member of a parent, DON'T compute its own responsiveSliderWidth.
    // Inherit `--everyday-slider-width` from the outer parent so all
    // embedded cards in the apartment tree have UNIFORM slider widths.
    // Without this skip, an embedded "Main" card with 6 members shrinks
    // its sliders to 41 px while siblings (Bathroom/Hall/Kitchen, 2-3
    // members each) stay at 47 px — Stefan PA-11: "die slider von Main
    // sind schmaler als die anderen. Das macht keinen sinn (wenn nicht
    // manuell so konfiguriert). bitte per default sollen alle die
    // gleiche breite haben". User's explicit `slider.width` config still
    // wins. Non-embedded standalone cards keep the shrinkage logic so
    // wide groups still adapt sensibly.
    //
    // Stefan-2026-05-11 R276 (PA-13 Issue 1+2): shrink based on TOTAL
    // LEAVES (recursive depth-sum), not direct N. At the outermost level
    // of a nested apartment view, the All card has only 2 direct members
    // (Back, Main) but 14 total leaves. With direct-N logic the All card
    // kept sliders at 47 px → 14 × 47 + 13 × 18 = 892 px content overflowed
    // 600 px outer cards → Hall + Main both bumped into min-content and
    // distributed unevenly (Stefan PA-13: "Main steht vollkommen alleine
    // da", "Hall gaps größer wie bei anderen groups"). Counting all leaves
    // shrinks the slider to fit the outer card so fr-distribution stays
    // proportional at every level. Bare-string members count as 1.
    // Stefan-2026-05-12 R335 (PA-0003): drop the eager leaf-count slope.
    // Stefan-Quote PA-0003: "The width of the sliders should only be
    // touched if the card runs out of space horizontally". Pre-R335 we
    // shrank the slider proactively at totalLeafCount > 5 (slope
    // -4 px/leaf down to a 40 px floor), which made wide cards with many
    // leaves render thin sliders even though they had space. Post-R335
    // the default is the full 60 px; ANY narrowing only happens through
    // `resolveOverflow`'s `sliderOverride` path (R319-R322), which kicks
    // in only when `n * 60 + (n-1) * gapFloor > containerWidth`. User's
    // explicit `slider.width` config still wins via `this.sliderWidth`.
    // Embedded cards continue to inherit the parent's cascaded
    // `--everyday-slider-width` (unchanged from R264 behavior).
    const responsiveSliderWidth = this.sliderWidth
      ?? (this.embedded ? undefined : 60);
    // Stefan-2026-05-11 R253: when the card has nested members with
    // varying subtree-depths, equal 1fr columns give uneven entity
    // density — Back (8 leaves) and Main (6 leaves) each got 50% width
    // even though Back has more children to show. Compute per-member
    // leaf weights and use them as fr units. Bare-string members weigh 1.
    // For nested members, recursively count leaves through their config's
    // manual_members tree. Falls back to "equal columns" when no nested
    // members are present (the standalone path stays untouched).
    const memberWeights = this.memberIds.map((id) =>
      this._memberLeafWeight(id),
    );
    const useWeightedCols = this.memberConfigs.size > 0
      && memberWeights.some((w) => w > 1);
    const gridTemplateColumns = useWeightedCols
      ? memberWeights.map((w) => `${w}fr`).join(' ')
      : `repeat(${n}, 1fr)`;
    // Stefan-2026-05-12 R319-R322 (PA-0044): local override for
    // --everyday-slider-width when this card's children would otherwise
    // overlap (resolveOverflow detected `n*baseline + (n-1)*floorGap > cw`).
    // Override takes precedence over `responsiveSliderWidth` so the
    // overflow-resolution always wins. Descendants of this card inherit
    // the override via CSS-var cascade.
    // Stefan-2026-05-12 R349 (PA-0019): now ALSO factors in
    // `_childMinSliderNeed` — the smallest width any descendant card
    // reported via `slider-width-need` events. Min(own, descendant-min)
    // becomes the effective override so all branches of the sub-tree
    // converge to the same uniform width. Pre-r67 only `siblings under
    // the same parent` saw the override via cascade; descendants in
    // ANOTHER branch (e.g. hall-with-spots while bathroom shrunk) kept
    // their default 60. With min-coordination, hall-and-bathroom both
    // see the min (=48) and the apartment view stays visually uniform.
    const overrideCandidates: number[] = [];
    if (this._computedSliderWidthOverride !== undefined) {
      overrideCandidates.push(this._computedSliderWidthOverride);
    }
    if (this._childMinSliderNeed !== undefined) {
      overrideCandidates.push(this._childMinSliderNeed);
    }
    const minOverride = overrideCandidates.length > 0
      ? Math.min(...overrideCandidates)
      : undefined;
    const effectiveSliderWidth = minOverride ?? responsiveSliderWidth;
    const sizeOverrides = [
      `--member-count: ${n}`,
      effectiveSliderWidth !== undefined
        ? `--everyday-slider-width: ${effectiveSliderWidth}px`
        : '',
      effectiveSliderHeight ? `--everyday-slider-height: ${effectiveSliderHeight}px` : '',
      `--member-cols-template: ${gridTemplateColumns}`,
      // Stefan-2026-05-12 R299 (PA-0041): dynamic --member-cols-gap.
      // Same value as TILE_GRID_GAP threaded to <everyday-mindmap-path>
      // so the gap rendered visually and the gap consumed by the
      // mindmap-arm geometry are guaranteed to agree. Inline-style on
      // `.layout` cascades down to `.member-cols` and overrides the
      // `:host([depth='N'])` CSS-fallback rules. The fallback rules
      // remain in styles.ts purely as the pre-measurement initial
      // paint (no FOUC).
      `--member-cols-gap: ${TILE_GRID_GAP}px`,
    ]
      .filter(Boolean)
      .join('; ');

    const expandedGroupPickerActive = this._expandedGroupPicker.pickerOpen;
    // Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): compute inline color
    // for the group icon from hass-state of the GROUP entity. Honors the
    // host-provided `iconColor` config — undefined keeps CSS theming,
    // 'on-state' reflects group's aggregate RGB + brightness, literal
    // string overrides. Empty string → no inline style.
    const groupState = this.hass?.states[this.groupEntityId];
    const groupIsOn = groupState?.state === 'on';
    const groupRgb = groupState?.attributes.rgb_color as [number, number, number] | undefined;
    const groupBri = groupState?.attributes.brightness as number | undefined;
    const groupIconStyle = computeIconStateColor(this.iconColor, groupIsOn, groupRgb, groupBri);
    // Stefan-2026-05-11 R269: reverted R256 translateX shift on .group-row.
    // Stefan PA-11: "Die mindmap für Al -> Back / main ist zu weit rechts".
    // Group-icon stays centered at 50% of the card width; asymmetric arms
    // to weighted children dots (Back at 0.286W vs Main at 0.786W) are
    // visually balanced by the layout's stretching (R271) rather than
    // shifting the parent icon.
    const groupRow = html`
      <div class="group-row">
        <div
          class="tile group ${groupOn ? 'on' : 'off'} ${expandedGroupPickerActive ? 'lp' : ''}"
          role="button"
          tabindex="0"
          @click=${(ev: Event) => {
            ev.stopPropagation();
            ev.preventDefault();
          }}
          @keydown=${(ev: KeyboardEvent) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              this._onGroupTap(ev);
            }
          }}
        >
          <div class="ic">
            <!-- Stefan-2026-05-10 R158: ha-state-icon auto-resolves the
                 entity-registry icon (user-set via HA Customize) which
                 ha-icon misses (it only reads state.attributes.icon).
                 stateObj passes the live state for the entity, icon
                 stays as a fallback when no entity-registry icon is set.
                 Stefan-2026-05-11 P15.6-r63f (R305): inline color via
                 the shared icon_color config when set. -->
            <ha-state-icon
              class="compact-glyph"
              style=${groupIconStyle}
              .hass=${this.hass}
              .stateObj=${this.hass?.states[this.groupEntityId]}
              .icon=${groupIcon}
            ></ha-state-icon>
          </div>
          <div class="lbl">${this._groupName()}</div>
          ${expandedGroupPickerActive
            ? html`<div class="picker-overlay">${this._expandedGroupPicker.renderPicker()}</div>`
            : null}
        </div>
      </div>
    `;
    const memberCols = html`
      <div class="member-cols">
        ${this.memberIds.map((id) => {
          // Stefan-2026-05-10 P15.6-r48 (R208): nested-group rendering.
          // When a member has its own per-member config (the
          // `manual_members: [{ entity, group, ... }]` form), render an
          // embedded `<everyday-light-card>` instead of the regular
          // slider tile. The embedded card brings its own group/parallel/
          // saved-colors/etc — each level is fully self-contained. The
          // outer mindmap arms still anchor to the member-col edge for
          // r48 MVP; routing arms to the inner card's group-icon
          // position is a P21+ polish item per ADR 0005.
          const nestedConfig = this.memberConfigs.get(id);
          if (nestedConfig) {
            // Stefan-2026-05-11 R245: embedded children inherit the outer's
            // iconPosition (bottom by default). Reverted R241's forced
            // 'top' override — Stefan: "Whole tree muss bottom-up sein!!".
            // The visual hierarchy is consistently bottom-up: each level's
            // group-icon at its bottom, members above, arms going up.
            // Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): icon_color
            // propagates from outer card to embedded children when the
            // child doesn't explicitly override. Same field semantics
            // (undefined / 'on-state' / literal-color) at every depth.
            // Explicit child override still wins (e.g. user wants only
            // ONE leaf to reflect state while the rest stay themed).
            const childConfig: EverydayLightCardConfig = {
              type: 'custom:everyday-light-card',
              entity: id,
              icon_color: this.iconColor,
              ...nestedConfig,
              embedded: true,
            };
            // Stefan-2026-05-11 R279 (PA-13 follow-up): set `embedded`
            // property explicitly because direct `.config=` assignment does
            // NOT call the card's setConfig() method (which is what
            // normally syncs `this.embedded` from `config.embedded`).
            // Without this, the embedded card's `:host([embedded])` CSS
            // rule never activated — width:100% wasn't applied so embedded
            // cards rendered at content-width (138 px) instead of stretching
            // to their col fr-share (216 px), and Main looked narrow next
            // to Back's stretched neighbours.
            return html`
              <div class="member-col nested" data-entity=${id}>
                <everyday-light-card
                  .hass=${this.hass}
                  .config=${childConfig}
                  .embedded=${true}
                  .depth=${this.depth + 1}
                  @visible-leaf-count-change=${(ev: Event) =>
                    this._onChildVisibleLeafCountChange(id, ev)}
                ></everyday-light-card>
              </div>
            `;
          }
          const memberPicker = this._memberPickers.get(id);
          const memberPickerActive = memberPicker?.pickerOpen ?? false;
          // Per-entity icon (Stefan-2026-05-10 R150). hall_spots etc.
          // get their own attributes.icon instead of the shared override.
          const thisMemberIcon = this._entityIcon(id, 'mdi:lightbulb', this.memberIconName);
          // Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): per-member inline
          // color reflects THIS member's own entity state when icon_color
          // is 'on-state'. Literal-color or undefined apply uniformly
          // across all members. Each leaf gets its own RGB so a 5-member
          // group shows 5 different colors based on each lamp.
          const memberState = this.hass?.states[id];
          const memberIsOn = this._isMemberOn(id);
          const memberRgb = memberState?.attributes.rgb_color as [number, number, number] | undefined;
          const memberBri = memberState?.attributes.brightness as number | undefined;
          const memberIconStyle = computeIconStateColor(this.iconColor, memberIsOn, memberRgb, memberBri);
          return html`
            <div class="member-col" data-entity=${id}>
              <everyday-vertical-pill-slider
                .hass=${this.hass}
                .entity=${id}
                .mode=${this._modeFor(id)}
              ></everyday-vertical-pill-slider>
              <div
                class="tile member ${this._isMemberOn(id) ? 'on' : 'off'} ${memberPickerActive ? 'lp' : ''}"
                data-entity=${id}
              >
                <div class="ic">
                  <!-- Stefan-2026-05-10 R158: ha-state-icon for proper
                       entity-registry icon resolution.
                       Stefan-2026-05-11 P15.6-r63f (R305): inline color
                       per the host icon_color cascade. -->
                  <ha-state-icon
                    style=${memberIconStyle}
                    .hass=${this.hass}
                    .stateObj=${this.hass?.states[id]}
                    .icon=${thisMemberIcon}
                  ></ha-state-icon>
                </div>
                <div class="lbl">${this._memberLabel(id)}</div>
                ${memberPickerActive
                  ? html`<div class="picker-overlay">${memberPicker?.renderPicker()}</div>`
                  : null}
              </div>
            </div>
          `;
        })}
      </div>
    `;
    // Stefan-2026-05-11 R234b: per-member-radius override. When a member
    // is itself a nested group (has an entry in memberConfigs), draw its
    // dot at GROUP_R (23) instead of MEMBER_R (17). The bigger dot visually
    // matches the larger group-icon size of the embedded sub-card rendered
    // below — Stefan's "main is small in all but big in its own group"
    // complaint resolved by making outer-mindmap match the inner size.
    const NESTED_DOT_R = 23; // = DEFAULT_GROUP_R in mindmap-path.ts
    const MEMBER_DOT_R = 17; // = DEFAULT_MEMBER_R
    const memberRadii = this.memberIds.map((id) =>
      this.memberConfigs.has(id) ? NESTED_DOT_R : MEMBER_DOT_R,
    );
    // Stefan-2026-05-11 R260: per-member Y from ResizeObserver-measured
    // .member-col heights. For each member, compute the icon-center Y
    // (relative to topology-top): col-content-height MINUS the icon's
    // offset-from-col-bottom (= label height + half-icon). Bare members
    // use offset 35 (.tile.member: 34 ic + 4 + 14 lbl, half-icon 17 +
    // label 14 + gap 4 = 35). Nested members use offset 41 (.tile.group:
    // 46 ic + 4 + 14 lbl, half-icon 23 + label 14 + gap 4 = 41). Falls
    // back to undefined when no measurements yet (first render before
    // ResizeObserver fires) → mindmap-path uses its single _memberY
    // default. When `useResponsiveCoords` is false (= the standalone
    // non-nested path with hardcoded SVG coords), we skip memberYs
    // entirely so legacy views stay pixel-identical.
    const NESTED_ICON_BOTTOM_OFFSET = 41;
    const BARE_ICON_BOTTOM_OFFSET = 35;
    // Stefan-2026-05-11 R277 (PA-13 Issue 3): for nested members, prefer
    // the direct-measured icon Y from `_measuredMemberIconYs` (set by
    // `_measureNestedIconYs()` in `updated()`). The offset formula
    // (colHeight - 41) breaks when the embedded card's label wraps to two
    // lines or its internal layout shifts in ways the static 41 doesn't
    // capture. The direct measurement comes from getBoundingClientRect on
    // the embedded `.tile.group .ic` and is exact. Bare members keep the
    // offset formula since they don't have an embedded icon element to
    // query — their .tile.member sits at known col-bottom geometry.
    // Stefan-2026-05-11 P15.6-r63b (R297a / PA-0029): the gate was previously
    // `_memberColHeights.size > 0`, but the per-entity ResizeObserver-driven
    // col-heights map is sometimes empty (e.g. when nested embedded cards
    // own their own internal layout and the outer .member-col has zero
    // content-rect height because flex/grid auto-sizes from the child).
    // Meanwhile `_measuredMemberIconYs` IS populated via the direct
    // getBoundingClientRect walk in `_measureNestedIconYs` — that's the
    // authoritative per-member Y signal. Open the gate as soon as EITHER
    // map has data so the mindmap can use per-member Ys for member-dots
    // (otherwise it collapses to a single `_memberY` and all dots stack at
    // the same Y — Stefan PA-0029: "all → back/Main dots detached" + "alle
    // nodes ein bisschen detached bis auf bathroom expanded und main
    // expanded"). The per-entity branch inside the map below already
    // prefers the measured Y over the height-formula, so this widening is
    // purely safe.
    const memberYs = useResponsiveCoords && (this._measuredMemberIconYs.size > 0 || this._memberColHeights.size > 0)
      ? this.memberIds.map((id) => {
          const isNested = this.memberConfigs.has(id);
          // Stefan-2026-05-11 R293 (PA-14): direct measurement is now
          // preferred for BOTH nested and bare members. The
          // _measureNestedIconYs helper was extended to also capture
          // bare-member .tile.member .ic positions, so the colHeight -
          // offset formula is reserved as a defensive fallback for the
          // first paint before getBoundingClientRect has fired.
          const measured = this._measuredMemberIconYs.get(id);
          if (typeof measured === 'number' && measured > 0) return measured;
          const h = this._memberColHeights.get(id);
          if (h === undefined || h <= 0) return undefined;
          const offset = isNested
            ? NESTED_ICON_BOTTOM_OFFSET
            : BARE_ICON_BOTTOM_OFFSET;
          return Math.max(0, h - offset);
        })
      : undefined;
    // mindmap-path's prop is `number[]` not `(number | undefined)[]`. When
    // any member is missing a measurement, fall back to the whole array
    // being undefined so the component uses its single _memberY default.
    const memberYsClean: number[] | undefined =
      memberYs && memberYs.every((y) => typeof y === 'number')
        ? (memberYs as number[])
        : undefined;

    // Stefan-2026-05-12 P15.6-r63l (R315/R316/R317 / PA-0043): conditional
    // render parts. hideParent → skip groupRow entirely. showMindmap → skip
    // the SVG mindmap-bg. showIcons → handled inside the templates via
    // .hide-icons class on .topology (CSS hides .ic + .compact-glyph).
    const mindmapBg = this.showMindmap
      ? html`
          <everyday-mindmap-path
            class="topology-bg"
            aria-hidden="true"
            .members=${this._toMindmapMembers()}
            icon-position=${this.iconPosition}
            .memberYOverride=${useResponsiveCoords ? undefined : MEMBER_ICON_CENTER_Y}
            .groupYOverride=${useResponsiveCoords ? undefined : GROUP_DOT_Y}
            .tileGap=${TILE_GRID_GAP}
            .dotsEnabled=${this.mindmapDots}
            .groupDotEnabled=${true}
            .groupOn=${groupOn}
            .groupRgb=${this.hass?.states[this.groupEntityId]?.attributes?.rgb_color as [number, number, number] | undefined}
            .memberRadii=${memberRadii}
            .colWeights=${useWeightedCols ? memberWeights : undefined}
            .memberYs=${memberYsClean}
            group-icon-offset="46"
          ></everyday-mindmap-path>
        `
      : null;
    const parentRow = this.hideParent ? null : groupRow;
    const topologyClass = `topology${this.showIcons ? '' : ' hide-icons'}`;
    // Stefan-2026-05-13 R360 (PA-0021) follow-up: when expand_in_place is
    // active AND we're rendering the inline-expanded state of a compact
    // card, mark .layout with `expand-in-place-active` so the CSS rule
    // can drop the legacy `min-height: 380px; justify-content: flex-end`
    // pair. Pre-R360 the legacy values pushed the topology DOWN by 28-29
    // px (HA's hui-card sized the parent to 430 px, content was 399 px,
    // flex-end packed content to the bottom of the reserved space). The
    // OVERHEAD math derivation assumes the host shrinks to content; this
    // class removes the height-floor so the assumption holds.
    const expandInPlaceActiveCls = isInlineExpandedCompact && this.expandInPlace
      ? ' expand-in-place-active'
      : '';
    return html`
      <div class="layout${expandInPlaceActiveCls}" style=${sizeOverrides}>
        <div class=${topologyClass}>
          ${mindmapBg}
          ${parentRow === null
            ? memberCols
            : (isTop ? html`${parentRow}${memberCols}` : html`${memberCols}${parentRow}`)}
        </div>
      </div>
    `;
  }

  /**
   * Parallel-sliders popup content (Stefan-2026-05-09 P43 R20 / P45 R26a).
   * N sliders side-by-side for the same entity, one per configured axis.
   * Default 4: brightness + temperature + hue + saturation.
   *
   * Stefan-2026-05-09 P45 R26a: popup mounts at the SLIDER's exact position
   * (NOT viewport-centred). The slider's bounding rect was captured when
   * the picker fired. Popup grows downward AND/OR sideways from there to
   * fit the N parallel sliders. Original slider is hidden via state class.
   */
  private _renderParallelSlidersPopup(): TemplateResult {
    const target = this._parallelSlidersTarget;
    const r = this._parallelAnchorRect;
    // Stefan-2026-05-12 R333 (PA-0015): prefer the picker-dot origin when
    // present. Fallback to slider-rect for non-picker triggers (see
    // _applyPickerMode parallel branch).
    const origin = this._parallelPopupOrigin;
    if (!target || (!origin && !r)) return html``;

    // Stefan-2026-05-12 P15.6-r63i (R307 / PA-0039): default OFF.
    // Pre-r63i was `!== false` → labels ON by default. Stefan-Quote:
    // "please disable the lables for the paralell sliders (pop up und
    // inline) by default". Opt-in via `show_labels: true`.
    const showLabels = this.parallelSlidersConfig?.show_labels === true;
    // Stefan-2026-05-12 P15.6-r63i (R308 / PA-0039): popup default 170 → 220
    // to match the parent's default slider height (compact-group + parallel-
    // inline both default to 220 via vertical-pill-slider :host fallback;
    // see group-layout-expanded.styles.ts:223 and everyday-light-card.ts:729).
    // Stefan-Quote: "the paralell slider pop ups sliders should have the
    // same slider length as its parent". Stefan-2026-05-12 PA-0002: bumped
    // universal default 220 → 270 (and full-length alias 260 → 270 for
    // backwards compat — equal to the new default).
    const sliderHeightPx = this.fullLengthSliders ? 270 : 270;

    // Stefan-2026-05-12 R332 (PA-0012): `parallel_sliders.layout: compact`
    // means "brightness slider only" — for the popup variant, collapse the
    // modes-list to `['brightness']` regardless of the `modes:` config.
    // The compact-layout flag is the user's "give me ONE slider" signal,
    // and the popup honors it by rendering a single column. Expanded keeps
    // the full N-axis stack.
    const popupModes: SliderMode[] = this.parallelSlidersConfig?.layout === 'compact'
      ? ['brightness']
      : target.modes;

    // Width grows with the number of parallel sliders. Each slider is
    // ~60 px wide + 22 px gap; pad outer padding 20 px each side.
    // Stefan-2026-05-11 R287 (PA-14): drop the previous `Math.max(r.width,
    // ...)` clamp. The clamp made the popup at-least-as-wide as the
    // anchoring slider, which in nested-card contexts could be the full
    // card-width — the popup then covered the entire card and every click
    // (including ones meant to dismiss it) landed inside the `.parallel-
    // popup` boundary, defeating the outside-click handler at line ~1980.
    // Stefan PA-14: "to close the parallel slider pop up you have to click
    // outside of the card" + "way too wide (it fits the width of the card.
    // It should just be as wide as necessary)". Floor at 160 px so a
    // single-mode popup (degenerate case) doesn't collapse to nothing.
    // Side-effect: R286 (close-on-click-outside-popup) auto-fixes since
    // the popup is now narrower than the card — clicks inside the card
    // but outside the popup are now legitimately "outside".
    const popupWidth = Math.max(160, popupModes.length * 82 + 20);
    // Stefan-2026-05-12 R333 (PA-0015): popup positioning has two paths:
    //   - origin (picker-dot): bottom-center of popup anchored at the dot
    //     coord, so the popup blooms from where the user released the
    //     parallel-icon. Matches wheel/saved popup convention.
    //   - r (slider-rect fallback): legacy P45-R26a anchor — bottom-edge
    //     aligns with the slider's bottom-edge, x-centered on slider.
    //     Used by non-picker triggers (expand_inline_parallel double-tap).
    const popupStyle = origin
      ? [
          'position: absolute',
          // X-axis: centred on the picker-dot.
          `left: ${origin.x + window.scrollX - popupWidth / 2}px`,
          // Y-axis: dot's doc-y. translateY(-100%) lifts popup so its
          // bottom-edge sits at this y, giving popup-bottom-center = dot.
          `top: ${origin.y + window.scrollY}px`,
          `width: ${popupWidth}px`,
          'transform: translateY(-100%)',
        ].join('; ')
      : [
          'position: absolute',
          // X-axis: centred on the original slider.
          `left: ${r!.left + window.scrollX + r!.width / 2 - popupWidth / 2}px`,
          // Y-axis: doc-y of the slider's bottom-edge. translateY(-100%) shifts
          // popup up by its own height so its bottom-edge sits at this y. The
          // popup-card's content is laid out so the SLIDERS sit at popup-bottom
          // (labels above), giving slider-bottom = original-slider-bottom.
          `top: ${r!.bottom + window.scrollY}px`,
          `width: ${popupWidth}px`,
          `min-height: ${r!.height}px`,
          'transform: translateY(-100%)',
        ].join('; ');

    return html`
      <div
        class="parallel-popup anchored"
        style=${popupStyle}
        @click=${(ev: Event) => ev.stopPropagation()}
      >
        <div class="popup-card anchored-card parallel-card">
          <div class="popup-body parallel-body">
            ${popupModes.map(
              (m) => html`
                <div class="parallel-col">
                  ${showLabels
                    ? html`<span class="parallel-lbl">${m}</span>`
                    : null}
                  <everyday-vertical-pill-slider
                    class="popup-slider"
                    style=${`--everyday-slider-height: ${sliderHeightPx}px`}
                    .hass=${this.hass}
                    .entity=${target.entityId}
                    .mode=${m}
                  ></everyday-vertical-pill-slider>
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }

  // ---------- derive ----------

  // Stefan-2026-05-10 P15-Phase-2 r33b: derive helpers extracted to
  // helpers/group-derive.ts as pure functions. Thin wrappers preserved
  // here so callsites stay terse — `this._groupName()` reads cleaner
  // inline than `deriveGroupName(this.hass, this.groupEntityId)` in a
  // template-literal. The actual logic lives once in group-derive.ts.
  private _groupName(): string {
    // Stefan-2026-05-11 R275 (PA-13 Issue 6): user-config name wins over
    // friendly_name. Without this short-circuit `light.everyday_all` with
    // `name: Apartment` always rendered "Everyday All" (the derived
    // friendly_name).
    return this.groupName ?? deriveGroupName(this.hass, this.groupEntityId);
  }

  /**
   * Stefan-2026-05-11 R275 (PA-13 Issue 6): group-icon resolution prefers
   * the user override over the HA entity-registry icon (inverse of R150's
   * per-member chain). Top-level `config.icon` is an explicit branding
   * choice for the parent card and must win even when the underlying
   * group-entity already has a customised registry icon. `resolveEntityIcon`
   * keeps the member-tile chain (registry > override > fallback) since
   * R150 was specifically about preserving per-entity registry icons.
   */
  private _groupIcon(fallback: string): string {
    return (
      this.groupIconName
      ?? (this.hass?.states[this.groupEntityId]?.attributes?.icon as string | undefined)
      ?? fallback
    );
  }

  private _memberLabel(memberId: string): string {
    return deriveMemberLabel(this.hass, memberId);
  }

  private _toMindmapMembers(): MindmapMember[] {
    return deriveMindmapMembers(this.hass, this.memberIds);
  }

  private _isMemberOn(memberId: string): boolean {
    return isLightOn(this.hass, memberId);
  }

  private _isGroupOn(): boolean {
    return isLightOn(this.hass, this.groupEntityId);
  }

  /**
   * Close every picker overlay except the one passed in. Wired to each
   * picker controller's `onPickerOpen` callback so the single-active-
   * picker invariant holds — opening tile-A's picker closes any picker
   * that was open on tile-B. Stefan-2026-05-10 P15.6.
   */
  private _closePickersExcept(except: PickerController): void {
    if (this._expandedGroupPicker !== except) this._expandedGroupPicker.closePicker();
    if (this._compactGroupPicker !== except) this._compactGroupPicker.closePicker();
    for (const ctrl of this._memberPickers.values()) {
      if (ctrl !== except) ctrl.closePicker();
    }
  }

  // ---------- group-tap handler ----------

  private _onGroupTap = (ev: Event): void => {
    ev.stopPropagation();
    if (!this.hass) return;
    // Stefan-2026-05-10 P15.6-r28 (R154 cleanup): debug-log removed after
    // tap-to-on regression was confirmed fixed. Original log at this site
    // proved the gate-logic worked; keeping it would only ship console
    // noise to end-users. If the bug ever recurs, restore via git history.
    // Stefan-2026-05-08-evening: while a popup is open (color-wheel,
    // saved-colors, future effects-list), tapping the main group icon is
    // the explicit "back to expanded view" gesture - it closes the popup
    // and KEEPS the expansion open. Only when no popup is open does the
    // tap mean "toggle the group on/off".
    if (this._wheelTarget || this._savedColorsTarget || this._effectsTarget || this._scenesTarget) {
      this._wheelTarget = null;
      this._savedColorsTarget = null;
      this._savedColorsEditing = false;
      this._effectsTarget = null;
      // Stefan-2026-05-10 P15.6-r45 (R217): also reset edit-mode + trimmed
      // active-order so reopening the popup starts in default mode with
      // the full effect_list visible.
      this._effectsEditMode = false;
      this._effectsPopupActiveOrder = [];
      // Stefan-2026-05-16 PA-0001 (scenes_list): same close-on-group-tap
      // behaviour for the scenes popup. PA-0005: also reset edit-mode +
      // trimmed active-order so reopening starts clean.
      this._scenesTarget = null;
      this._scenesEditMode = false;
      this._scenesPopupActiveOrder = [];
      return;
    }
    void groupToggleWithRestore(this.hass, this.groupEntityId, this.memberIds);
  };

  // ---------- member-icon gesture handling (P6) ----------

  /**
   * Rebuild member-picker controllers + bind to current tile elements
   * (Stefan-2026-05-10 P15.6). One PickerController per member entity,
   * stored in `_memberPickers` Map. When `memberIds` changes, controllers
   * for departed entities are removed (Lit's `removeController`) and new
   * ones for arrivals are created. Then every current tile is rebound
   * via `bindIcon(el)`. Cross-controller coordination via `onPickerOpen`
   * → `_closePickersExcept` keeps single-active-picker invariant.
   */
  private _rebindMemberGestures(): void {
    // Reconcile the controller Map against the current memberIds set.
    const desired = new Set(this.memberIds);
    for (const [id, ctrl] of this._memberPickers) {
      if (!desired.has(id)) {
        this.removeController(ctrl);
        this._memberPickers.delete(id);
      }
    }
    for (const id of this.memberIds) {
      if (!this._memberPickers.has(id)) {
        this._memberPickers.set(id, this._createMemberPicker(id));
      }
    }
    // Bind every current tile element to its controller. Tiles that
    // aren't on screen yet (compact-collapsed view) end up with no
    // bindIcon call; their next render-cycle's _rebindMemberGestures
    // will pick them up once they're queryable.
    if (!this._memberTileEls) return;
    this._memberTileEls.forEach((el) => {
      const id = el.dataset.entity;
      if (!id) return;
      this._memberPickers.get(id)?.bindIcon(el);
    });
  }

  /**
   * Construct a PickerController bound to a specific member-entity id
   * (closure capture). Used by `_rebindMemberGestures` when a new member
   * appears in `memberIds`.
   */
  private _createMemberPicker(id: string): PickerController {
    return new PickerController(this, {
      variant: 'member',
      longPressMs: this.longPressMs,
      hassProvider: () => this.hass,
      entityIdProvider: () => id,
      // Stefan-2026-05-10 P15.6-r35 (R196): supply the slider's current
      // mode so the picker's cycle-slot can render the next-mode icon.
      currentSliderModeProvider: () => {
        const m = this._memberModes[id];
        return (m === 'temperature' || m === 'hue' || m === 'saturation') ? m : 'brightness';
      },
      onTap: () => {
        if (this.memberTap === 'none') return;
        if (this.memberTap === 'classic_more_info') {
          // Phase 9 deliverable - HA more-info dialog. Stub for now.
          this._showToast('classic-mode more-info arrives in Phase 9');
          return;
        }
        if (!this.hass) return;
        void this.hass.callService('light', 'toggle', { entity_id: id });
      },
      onDoubleTap: () => {
        // Stefan-2026-05-12 R325 (PA-0006): per-member config-driven double-
        // tap. Reads `gestures.member_icon.double_tap` from THIS member's
        // own config (object-form ManualMember in the host's manual_members
        // array). Falls back to R195 default (cycle_mode) when no action.
        const memberCfg = this.memberConfigs.get(id);
        const action = memberCfg?.gestures?.member_icon?.double_tap;
        if (action) {
          // Stefan-2026-05-12 R326: pass captured origin for popup anchoring.
          const picker = this._memberPickers.get(id);
          this._runDoubleTapAction(id, action, 'member', picker?.origin ?? null);
          return;
        }
        // Default: Stefan-2026-05-10 P15.6-r35 (R195) cycle_mode.
        const newMode = this._cycleNextMode(id);
        this._setMemberMode(id, newMode);
      },
      onModePicked: (mode, origin) => {
        this._applyPickerMode(id, mode as PickerMode, origin, 'member');
      },
      onPickerOpen: () => {
        const ctrl = this._memberPickers.get(id);
        if (ctrl) this._closePickersExcept(ctrl);
      },
      // Stefan-2026-05-12 PA-0002 (R1): effects slot opt-in flag forwarded.
      effectsInPickerProvider: () => this.effectsInPicker,
    });
  }

  /**
   * Stefan-2026-05-12 R325 (PA-0006): single dispatch for config-driven
   * double-tap actions on the group icon AND each member tile. Mirrors the
   * action vocabulary in `everyday-light-card.ts._handleDoubleTap` (which
   * only fired on the parallel-inline path) so the same `gestures.*.double_tap`
   * config field works inside the expanded-group renderer too.
   *
   * `entityId` — light entity to act on (group id for group-icon, member
   * id for member-tile).
   * `action`   — GestureAction to dispatch.
   * `variant`  — picker variant for popup-anchor math when the action
   * routes through `_applyPickerMode`.
   *
   * Unhandled actions return without error so unknown values from older
   * config files degrade silently.
   */
  private _runDoubleTapAction(
    entityId: string,
    action: GestureAction,
    variant: PickerVariant,
    iconOrigin: { x: number; y: number } | null = null,
  ): void {
    if (!this.hass || !entityId) return;
    if (action === 'none') return;
    if (action === 'toggle') {
      void this.hass.callService('light', 'toggle', { entity_id: entityId });
      return;
    }
    if (action === 'toggle_with_restore') {
      if (entityId === this.groupEntityId) {
        this._onGroupTap(new Event('synthetic-double-tap'));
      } else {
        void this.hass.callService('light', 'toggle', { entity_id: entityId });
      }
      return;
    }
    if (action === 'color_wheel') {
      // Stefan-2026-05-12 R326 (PA-0007 deep-dive): pass iconOrigin so
      // _applyPickerMode can compute popupOrigin via pickerDotPosition.
      // null iconOrigin → null popupOrigin → host's render guard hides the
      // popup. The picker controller's captureOrigin() runs before our
      // double-tap closure fires, so `<picker>.origin` is fresh.
      this._applyPickerMode(entityId, 'wheel', iconOrigin, variant);
      return;
    }
    if (action === 'saved_colors') {
      this._applyPickerMode(entityId, 'saved', iconOrigin, variant);
      return;
    }
    if (action === 'expand_inline') {
      if (this.compact) this._compactExpanded = true;
      return;
    }
    if (action === 'expand_inline_parallel') {
      // Parallel-popup branch anchors via slider-rect lookup (entity-based),
      // not iconOrigin — so passing null here is fine.
      this._applyPickerMode(entityId, 'parallel', null, 'member');
      return;
    }
    if (action === 'cycle_mode') {
      this._setMemberMode(entityId, this._cycleNextMode(entityId));
      return;
    }
    if (action === 'effects_list') {
      this._applyPickerMode(entityId, 'effects', iconOrigin, variant);
      return;
    }
    if (action === 'scenes_list') {
      // Stefan-2026-05-16 PA-0001 (scenes_list): open scenes popup at the
      // tapped icon. Same anchor + portal path as the effects popup; we
      // set `_scenesTarget` so the body-portal render-pass mounts the
      // scenes-list-picker rooted at `_popupOrigin`.
      this._scenesTarget = entityId;
      if (iconOrigin) this._popupOrigin = iconOrigin;
      this._popupOpenedAt = Date.now();
      return;
    }
    if (action === 'classic_more_info') {
      this.dispatchEvent(
        new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId },
        }),
      );
      return;
    }
    if (action === 'mode_picker') {
      this._applyPickerMode(entityId, 'wheel', iconOrigin, variant);
      return;
    }
    // 'expand_overlay' — legacy topology-popup overlay (not wired here).
  }

  private _applyPickerMode(
    entityId: string,
    mode: PickerMode,
    iconOrigin: { x: number; y: number } | null,
    variant: PickerVariant = 'member',
  ): void {
    // Hoisted to top so the effects branch (R209+R214) can also use it
    // for popup-anchoring. Wheel/saved branches further below also
    // consume `popupOrigin`.
    const stateObj = this.hass?.states[entityId];
    const effectList = stateObj?.attributes?.effect_list as string[] | undefined;
    const hasEffects = Array.isArray(effectList) && effectList.length > 0;
    // Stefan-2026-05-11 R290 (PA-14): when the compact-group picker has
    // additionalMindmap enabled, the popup-dot positions are spread over
    // a pentagon/hexagon (n=5 or 6) instead of a square (n=4). Pass the
    // flag through so wheel/saved/effects popups bloom from their actual
    // rendered dot positions instead of falling back to icon-center.
    const additionalMindmap = variant === 'group-compact' && this.compact && !this.embedded;
    const popupOrigin = iconOrigin
      ? pickerDotPosition(mode, iconOrigin, variant, { hasEffects, additionalMindmap })
      : iconOrigin;
    if (mode === 'temp') {
      // Toggle temp ↔ brightness via _setMemberMode so the temp-on path
      // re-applies the previous color_temp_kelvin to the light.
      const next: SliderMode =
        this._memberModes[entityId] === 'temperature' ? 'brightness' : 'temperature';
      this._setMemberMode(entityId, next);
      return;
    }
    if (mode === 'cycle') {
      // Stefan-2026-05-10 P15.6-r35 (R196): cycle picks advance the slider
      // mode by one step in the configured cycle (color_temp lights:
      // brightness ↔ temp; color lights: brightness → hue → saturation
      // → brightness). The picker icon already showed the next-mode glyph
      // so the user knew what they'd get.
      const next = this._cycleNextMode(entityId);
      this._setMemberMode(entityId, next);
      return;
    }
    if (mode === 'effects') {
      // Stefan-2026-05-10 P15.6-r43 (R209 + R214): open effects-list as
      // a portal popup at the picker-dot position. r35 fired
      // `hass-more-info` as a stub (R197 initial impl) — Stefan flagged
      // ("anstatt die effect liste öffnet sich das standard HA light-
      // card pop up"). Now the popup mirrors saved-colors/wheel: state
      // sets target, _origin offsets to dot via pickerDotPosition, the
      // body-portal render-pass mounts the effects-list-picker.
      this._effectsTarget = entityId;
      if (popupOrigin) this._popupOrigin = popupOrigin;
      this._popupOpenedAt = Date.now();
      return;
    }
    if (mode === 'mindmap') {
      // Stefan-2026-05-10 R131: two expansion modes for the compact-group
      // Mindmap action. 'inline' (default) flips _compactExpanded so the
      // SAME card transforms in-place into the N-slider topology view —
      // sibling dashboard cards reflow, expanded state is persistable.
      // 'popup' keeps the legacy body-portal overlay (P43-R21).
      if (variant === 'group-compact') {
        if (this.expansionMode === 'popup') {
          this._topologyAnchorRect = this.getBoundingClientRect();
          this._topologyPopupOpen = true;
          this._popupOpenedAt = Date.now();
        } else {
          this._compactExpanded = true;
        }
      }
      return;
    }
    if (mode === 'collapse') {
      // Stefan-2026-05-12 PA-0002 (R2a): fold the inline-expanded compact
      // card back to its collapsed state. Only fires from the
      // `group-expanded` variant (picker-geometry gates the slot to that
      // variant, and only when `expansionSticky` is true). The state
      // change cascades through updated() which persists to localStorage,
      // unmounts member-pickers, and resets _memberModes. Stefan-Quote:
      // "the mode picker needs to have an option to collapse the node".
      if (variant === 'group-expanded' && this.compact) {
        this._compactExpanded = false;
      }
      return;
    }
    if (mode === 'parallel') {
      // Stefan-2026-05-12 R336 (PA-0016 partial-revert of R333): when the
      // user triggers parallel-popup from a MEMBER tile (variant='member',
      // a leaf where the slider sits directly above the icon), restore the
      // pre-R333 slider-rect anchor. Stefan-Quote PA-0016: "for child nodes
      // (where the slider is directly above the child icon) the paralell
      // sliders pop up should appear as it was before: The slider length
      // should be the same as the slider which is directly above the child
      // icon and it should be in the same vertical position as the slider
      // which is directly above the child icon".
      //
      // Picker-dot anchor (R333) is kept ONLY for variants without an
      // overlying slider — compact-group tiles (variant='group-compact')
      // and other no-slider-above contexts. There the bottom-center of the
      // popup at the picker-dot mirrors the wheel/saved popup convention.
      //
      // Decision matrix:
      //   variant='member'         → slider-rect anchor (R336 revert)
      //   variant='group-compact'  → picker-dot anchor (R333)
      //   variant='group-expanded' → picker-dot anchor (no slider above)
      //   variant='parallel-inline'→ picker-dot anchor (no slider above)
      //   action='expand_inline_parallel' (no iconOrigin) → slider-rect
      const modes = this.parallelSlidersConfig?.modes
        ?? ['brightness', 'temperature', 'hue', 'saturation'];
      const preferSliderRect = variant === 'member' || !popupOrigin;
      if (!preferSliderRect && popupOrigin) {
        this._parallelPopupOrigin = popupOrigin;
        this._parallelAnchorRect = null;
      } else {
        // Stefan-2026-05-09 P45 R26a + R336 (PA-0016): slider-rect anchor.
        // Find the slider nested under the long-pressed member-tile and
        // capture its bounding rect. Defensive host-rect fallback in case
        // the slider isn't found. Stefan-2026-05-09 P47-fix: when triggered
        // from inside the topology-popup, the tile lives in the body-portal
        // (document tree), NOT in this.renderRoot. Query both locations so
        // the anchor rect lands on the actual slider, not on the host card.
        const tileSelector = `.tile.member[data-entity="${CSS.escape(entityId)}"]`;
        const tileEl = (this.renderRoot.querySelector(tileSelector)
          ?? this._popupPortal?.querySelector(tileSelector)) as HTMLElement | null;
        const memberCol = tileEl?.parentElement;
        const sliderEl = memberCol?.querySelector('everyday-vertical-pill-slider') as HTMLElement | null;
        this._parallelAnchorRect = sliderEl
          ? sliderEl.getBoundingClientRect()
          : this.getBoundingClientRect();
        this._parallelPopupOrigin = null;
      }
      this._parallelSlidersTarget = { entityId, modes: modes as SliderMode[] };
      this._popupOpenedAt = Date.now();
      return;
    }
    // For wheel + saved, anchor the popup to the picker DOT's position
    // (Stefan: "Mitte vom color-wheel über dem color-wheel icon"). The
    // dot's angle depends on the variant — see _pickerDotPosition below.
    // popupOrigin already computed at top of function (r43 hoist).
    if (mode === 'wheel') {
      this._wheelTarget = entityId;
      if (popupOrigin) this._popupOrigin = popupOrigin;
      this._popupOpenedAt = Date.now();
      return;
    }
    // saved-colors (P7): open the picker for the active member.
    this._savedColorsTarget = entityId;
    this._savedColorsEditing = false;
    if (popupOrigin) this._popupOrigin = popupOrigin;
    this._popupOpenedAt = Date.now();
  }

  // ---------- saved-colors source (P7.1: persistence) ----------

  /**
   * Read saved-colors from the configured source and update `_savedColors`
   * if the parsed list differs from what's already there. Called on every
   * hass update so external mutations to the helper get reflected here too.
   *
   * Sources:
   *   - undefined / no config → keep the default (or current) palette;
   *     no persistence (lost on card reload).
   *   - `'static'` with a `static` array → use that array as the palette;
   *     mutations stay in component state, no persistence.
   *   - `'helper:input_text.<id>'` → read the JSON list from the helper's
   *     state attribute. Mutations write back via `input_text.set_value`.
   *
   *  - `'ha_favorites'` → not yet implemented (research pending), falls
   *      back to default palette.
   */
  private _syncSavedColorsFromSource(): void {
    const next = readSavedColorsFromSource(this.hass, this.savedColorsConfig, this._savedColors);
    if (next) this._savedColors = next;
    // Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): when no explicit
    // helper source is configured, also try the HA user_data fallback.
    // Scoped to the GROUP entity_id (one palette per group card, matches
    // pre-r63a architecture). Fire-and-forget; we don't want render-blocking
    // on every hass push. Only runs once per session per group card via the
    // `_userDataHydrated` guard so we don't spam the WebSocket every push.
    if (!this.savedColorsConfig?.source && !this._userDataHydrated && this.groupEntityId) {
      this._userDataHydrated = true;
      void readSavedColorsFromUserData(this.hass, this.groupEntityId).then((fromUd) => {
        if (fromUd && fromUd.length > 0) {
          this._savedColors = fromUd;
        }
      });
    }
  }

  // Stefan-2026-05-11 P15.6-r63a (R296-C): one-shot guard so the user_data
  // hydration happens exactly once per component lifetime. Subsequent
  // mutations + the local `_savedColors` state are the authority for the
  // current session; user_data is read-once-on-mount + write-on-mutate.
  private _userDataHydrated = false;

  private _persistSavedColorsToSource(): void {
    const result = persistSavedColorsToSource(this.hass, this.savedColorsConfig, this._savedColors);
    if (result && 'overflow' in result) {
      const { helperId, length, max } = result.overflow;
      this._showToast(
        `Saved-colors list (${length} chars) exceeds ${helperId} max (${max}). Increase the helper's max.`,
      );
    }
    // Stefan-2026-05-11 P15.6-r63a (R296-C / PA-0024): mirror to HA
    // user_data when no explicit helper source is configured. The local
    // `_savedColors` state is the immediate render-source-of-truth, so
    // we fire-and-forget the WS write — failure surfaces on the next
    // reload (entry won't appear), not interactively.
    if (!this.savedColorsConfig?.source && this.groupEntityId) {
      void persistSavedColorsToUserData(this.hass, this.groupEntityId, this._savedColors);
    }
  }

  // ---------- saved-colors handlers (P7) ----------

  private _onSavedColorPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._savedColorsTarget;
    if (!target || !this.hass) return;
    const { r, g, b, k } = ev.detail;
    // Stefan-2026-05-10 P15.6-r39 (R201): kelvin entries (4-tuple, k > 0)
    // fire `light.turn_on color_temp_kelvin: k` so the lamp lands at the
    // EXACT same kelvin the user saved — not the rgb approximation HA
    // computed for the swatch render. RGB entries (3-tuple, k undefined)
    // continue using rgb_color as before.
    if (typeof k === 'number' && k > 0) {
      void this.hass.callService('light', 'turn_on', {
        entity_id: target,
        color_temp_kelvin: k,
      });
      // Picking a kelvin entry: keep slider in temperature mode (or
      // switch to it) so the user sees the kelvin value they picked.
      if (this._memberModes[target] !== 'temperature') {
        this._memberModes = { ...this._memberModes, [target]: 'temperature' };
      }
    } else {
      void this.hass.callService('light', 'turn_on', {
        entity_id: target,
        rgb_color: [r, g, b],
      });
      // Stefan-2026-05-08-evening: picking an RGB colour means the user
      // wants colour, not temperature. If the slider was on temperature
      // mode, revert to brightness so the slider isn't showing stale
      // temp data for a bulb that's now in colour mode.
      if (this._memberModes[target] === 'temperature') {
        this._memberModes = { ...this._memberModes, [target]: 'brightness' };
      }
    }
    if (!this.savedPersistent) {
      this._savedColorsTarget = null;
    }
  };

  private _onSavedEnterEdit = (ev: Event): void => {
    ev.stopPropagation();
    this._savedColorsEditing = true;
  };

  private _onSavedRemove = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const idx = ev.detail.index as number;
    if (idx < 0 || idx >= this._savedColors.length) return;
    this._savedColors = [...this._savedColors.slice(0, idx), ...this._savedColors.slice(idx + 1)];
    this._persistSavedColorsToSource();
  };

  private _onSavedAddCurrent = (ev: Event): void => {
    ev.stopPropagation();
    const target = this._savedColorsTarget;
    if (!target) return;
    const s = this.hass?.states[target];
    const rgb = s?.attributes?.rgb_color as [number, number, number] | undefined;
    if (!rgb || rgb.length !== 3) {
      this._showToast('No active rgb to save (light may be off)');
      return;
    }
    // Stefan-2026-05-10 P15.6-r39 (R201): when the slider is in temperature
    // mode, save as a 4-tuple [r, g, b, k] where k = the actual kelvin
    // value. The rgb stays as the visual swatch representation HA already
    // computed; on pick, the host fires color_temp_kelvin: k instead of
    // rgb_color. This way the saved entry round-trips through HA's
    // hs→rgb→hs precision loss without drift, AND the lamp lands at the
    // EXACT kelvin the user saved.
    // Stefan-2026-05-10 P15.6-r45 (R201-regression): for group entities in
    // expanded view, the picker has NO 'temp' slot — _memberModes[group]
    // stays 'brightness' even when the lamp is actually in color_temp mode.
    // Accept the entity's HA-reported color_mode as a fallback signal so
    // saving from the group icon picks up the kelvin Stefan sees on screen.
    // Stefan-2026-05-11 R281 (PA-14): also fall back to `color_temp_kelvin`
    // attribute presence when `color_mode` is NOT explicitly one of the
    // color modes (hs/rgb/xy etc.). Some lamps report `color_mode: unknown`
    // immediately after a CT command, or aggregate the group's color_mode
    // as something non-CT even when all members are in CT. The kelvin attr
    // is the ground-truth signal in those edge cases.
    const colorMode = s?.attributes?.color_mode as string | undefined;
    const kelvin = s?.attributes?.color_temp_kelvin as number | undefined;
    const isExplicitColorMode =
      colorMode === 'hs'
      || colorMode === 'rgb'
      || colorMode === 'rgbw'
      || colorMode === 'rgbww'
      || colorMode === 'xy';
    const isTempMode =
      this._memberModes[target] === 'temperature'
      || colorMode === 'color_temp'
      || (!isExplicitColorMode && typeof kelvin === 'number' && kelvin > 0);
    const newEntry: ColorEntry = isTempMode && typeof kelvin === 'number' && kelvin > 0
      ? [rgb[0], rgb[1], rgb[2], kelvin]
      : [rgb[0], rgb[1], rgb[2]];
    // Avoid duplicating an entry that already matches within ~5/255 per
    // channel AND (for kelvin entries) within 50K of the kelvin value.
    const dup = this._savedColors.find((c) => {
      const rgbMatch =
        Math.abs(c[0] - newEntry[0]) < 5 &&
        Math.abs(c[1] - newEntry[1]) < 5 &&
        Math.abs(c[2] - newEntry[2]) < 5;
      if (!rgbMatch) return false;
      // Both kelvin: check k. One kelvin / one rgb: not a dup. Both rgb: dup.
      const newK = newEntry.length === 4 ? newEntry[3] : undefined;
      const oldK = c.length === 4 ? c[3] : undefined;
      if (newK === undefined && oldK === undefined) return true;
      if (newK !== undefined && oldK !== undefined) return Math.abs(newK - oldK) < 50;
      return false;
    });
    if (dup) {
      this._showToast('Color already saved');
      return;
    }
    this._savedColors = [...this._savedColors, newEntry];
    this._persistSavedColorsToSource();
    // Stefan-ADR 2026-05-08: only one color can be added per edit session,
    // so auto-exit edit-mode after a successful save. Re-enter via long-press.
    this._savedColorsEditing = false;
  };

  // Stefan-2026-05-16 PA-0001 (scenes_list): scene-pick from the popup.
  // Fire `scene.turn_on { entity_id, transition }` and close the popup
  // (scenes are typically one-shot — user picks, watches, doesn't keep
  // the picker open like a colour wheel). Transition seconds come from
  // `scenes_picker.transition` (default 0.4 s to match Hue-app feel).
  // Stefan-2026-05-16 PA-0005: in edit-mode the popup STAYS OPEN after
  // pick (mirrors effects-list R217 behaviour) so the user can continue
  // curating the active list.
  private _onScenePick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    if (!this.hass) return;
    const id = ev.detail?.id as string | undefined;
    if (!id) return;
    const transition = this.scenesPickerConfig?.transition ?? 0.4;
    void this.hass.callService('scene', 'turn_on', {
      entity_id: id,
      transition,
    });
    if (!this._scenesEditMode) {
      this._scenesTarget = null;
    }
  };

  // Stefan-2026-05-16 PA-0005: scenes-list popup edit-mode handlers.
  // Mirror the effects-list popup R217 flow. Long-press a row in default
  // mode → enter-edit (visual indicator: " · edit" suffix + Done button).
  // Long-press in edit-mode → delete that scene from the active list.
  // Tap a grayed row → restore. Tap outside any row → exit-edit.
  // Persistence is in-memory only at this level — popup is ephemeral;
  // closing it (or switching target entity) resets the trimmed order.
  // Cross-session persistence lives on the parallel-inline path's
  // host card via `scenes_picker.source` (same as effects).
  private _onScenesEnterEdit = (ev: Event): void => {
    ev.stopPropagation();
    this._scenesEditMode = true;
  };

  private _onScenesExitEdit = (ev: Event): void => {
    ev.stopPropagation();
    this._scenesEditMode = false;
  };

  private _onSceneDelete = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._scenesTarget;
    if (!target) return;
    const id = ev.detail?.id as string | undefined;
    if (!id) return;
    const fullList = discoverScenesForEntity(this.hass, target, {
      override: this.scenesPickerConfig?.scenes,
      stripPrefix: this.scenesPickerConfig?.name_strip_prefix !== false,
    }).map((s) => s.id);
    const current = this._scenesPopupActiveOrder.length > 0
      ? this._scenesPopupActiveOrder
      : fullList;
    this._scenesPopupActiveOrder = current.filter((s) => s !== id);
  };

  private _onSceneRestore = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._scenesTarget;
    if (!target) return;
    const id = ev.detail?.id as string | undefined;
    if (!id) return;
    const fullList = discoverScenesForEntity(this.hass, target, {
      override: this.scenesPickerConfig?.scenes,
      stripPrefix: this.scenesPickerConfig?.name_strip_prefix !== false,
    }).map((s) => s.id);
    const current = this._scenesPopupActiveOrder.length > 0
      ? this._scenesPopupActiveOrder
      : fullList;
    if (current.includes(id)) return;
    this._scenesPopupActiveOrder = [...current, id];
  };

  // Stefan-2026-05-10 P15.6-r43 (R209 + R214): effects-pick from the
  // mode-picker → effects popup. Fire `light.turn_on effect: <name>`,
  // close the popup, optionally cycle slider mode back to brightness.
  // Stefan-2026-05-10 P15.6-r45 (R217): in edit-mode, tap-to-pick still
  // applies the effect (consistent with the standalone view-mode), but
  // the popup STAYS OPEN so the user can keep editing the active list.
  private _onEffectPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._effectsTarget;
    if (!target || !this.hass) return;
    const effect = ev.detail?.effect as string | undefined;
    if (!effect) return;
    void this.hass.callService('light', 'turn_on', {
      entity_id: target,
      effect,
    });
    // Close popup after pick (effects are usually one-shot — user picks
    // a scene, watches it run, doesn't keep the picker open). Skip the
    // close when in edit-mode so the user can continue trimming the list.
    if (!this._effectsEditMode) {
      this._effectsTarget = null;
    }
  };

  // Stefan-2026-05-10 P15.6-r45 (R217): edit-mode handlers for the
  // effects-list-picker mounted in the body-portal popup. Long-press a
  // row in default mode → enter-edit (visual indicator: " · edit" suffix
  // + Done button). Long-press in edit-mode → delete that effect from
  // the active list. Tap a grayed row → restore. Tap outside any row →
  // exit-edit. Persistence is in-memory only — popup is ephemeral, so
  // closing it (or switching target entity) resets the trimmed order.
  // Cross-session persistence lives in the parallel-inline path's
  // helper-source flow (R75 R98 effects_picker.source).
  private _onEffectsEnterEdit = (ev: Event): void => {
    ev.stopPropagation();
    this._effectsEditMode = true;
  };

  private _onEffectsExitEdit = (ev: Event): void => {
    ev.stopPropagation();
    this._effectsEditMode = false;
  };

  private _onEffectsDelete = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._effectsTarget;
    if (!target) return;
    const effect = ev.detail?.effect as string | undefined;
    if (!effect) return;
    const fullList =
      (this.hass?.states[target]?.attributes?.effect_list as
        | string[]
        | undefined) ?? [];
    const current =
      this._effectsPopupActiveOrder.length > 0
        ? this._effectsPopupActiveOrder
        : fullList;
    this._effectsPopupActiveOrder = current.filter((e) => e !== effect);
  };

  private _onEffectsRestore = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._effectsTarget;
    if (!target) return;
    const effect = ev.detail?.effect as string | undefined;
    if (!effect) return;
    const fullList =
      (this.hass?.states[target]?.attributes?.effect_list as
        | string[]
        | undefined) ?? [];
    const current =
      this._effectsPopupActiveOrder.length > 0
        ? this._effectsPopupActiveOrder
        : fullList;
    if (current.includes(effect)) return;
    this._effectsPopupActiveOrder = [...current, effect];
  };

  private _onColorPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const target = this._wheelTarget;
    if (!target || !this.hass) return;
    const { r, g, b } = ev.detail;
    void this.hass.callService('light', 'turn_on', {
      entity_id: target,
      rgb_color: [r, g, b],
    });
    // Stefan-2026-05-08-evening: picking from the wheel implies colour, not
    // temperature - if the slider was on temp mode, revert to brightness
    // so the bulb-state and the slider mode stay in sync.
    if (this._memberModes[target] === 'temperature') {
      this._memberModes = { ...this._memberModes, [target]: 'brightness' };
    }
    // Persistent (default) keeps the popup open so the user can keep
    // sampling colors. Single-pick mode dismisses immediately.
    if (!this.wheelPersistent) {
      this._wheelTarget = null;
    }
  };

  private _installOutsideClickListener(): void {
    if (this._outsideClickListener) return;
    this._outsideClickListener = (ev: MouseEvent) => {
      // Use composedPath() because the click may originate inside a shadow
      // root (lit-rendered children of this host).
      const path = ev.composedPath();
      const inPicker = path.some((n) => (n as Element)?.classList?.contains?.('picker-overlay'));
      const inPopup = path.some((n) => (n as Element)?.classList?.contains?.('inplace-popup'));
      const inTopologyPopup = path.some((n) => (n as Element)?.classList?.contains?.('topology-popup'));
      const inParallelPopup = path.some((n) => (n as Element)?.classList?.contains?.('parallel-popup'));
      const withinSuppression = Date.now() - this._popupOpenedAt < 250;

      // Picker-overlay dismissal lives inside each PickerController's own
      // outside-click handler (P15.5/P15.6). The host listener below only
      // handles wheel/saved/topology/parallel popup dismissal.

      // Topology + parallel-sliders popups (P43 R21/R20). Outside-click
      // closes the matching popup; doesn't fall through to compact-
      // collapse handling. Also clear the captured anchor rect so the
      // next open captures fresh coordinates (window resize / scroll).
      // Stefan-2026-05-09 P47-fix: when the user picks a color from the
      // wheel/saved popup which is OPEN ON TOP of the topology popup,
      // the click lands inside `.inplace-popup` but outside `.topology-
      // popup`. Without the `inPopup` guard, this would close the
      // topology popup underneath. Treating clicks inside wheel/saved
      // popups as "still inside the topology context" keeps the
      // topology popup open as the user samples colors.
      if (this._topologyPopupOpen) {
        if (!inTopologyPopup && !inPopup && !inParallelPopup && !withinSuppression) {
          this._topologyPopupOpen = false;
          this._topologyAnchorRect = null;
        }
        return;
      }
      if (this._parallelSlidersTarget) {
        if (!inParallelPopup && !inPopup && !withinSuppression) {
          this._parallelSlidersTarget = null;
          this._parallelAnchorRect = null;
          // Stefan-2026-05-12 R333 (PA-0015): also clear the picker-dot
          // origin so the next open recomputes anchor from scratch and
          // doesn't reuse a stale dot-position from a different member.
          this._parallelPopupOrigin = null;
        }
        return;
      }

      // Stefan-2026-05-08-evening: when a wheel/saved-colors popup is open,
      // outside-click ONLY closes the popup. We don't run the compact-
      // collapse path here, so the user can dismiss the colour picker by
      // tapping the empty area without losing the expanded view they're
      // currently working in.
      // Stefan-2026-05-10 P15.6-r46 (R220): also include `_effectsTarget`
      // so the effects-list portal popup closes on outside-click.
      // Stefan-Quote: "effects list dosent close when you click/ tap
      // somwhere else".
      const popupOpen =
        this._wheelTarget !== null
        || this._savedColorsTarget !== null
        || this._effectsTarget !== null
        || this._scenesTarget !== null;
      if (popupOpen) {
        if (!inPopup && !withinSuppression) {
          if (this._wheelTarget) this._wheelTarget = null;
          if (this._savedColorsTarget) {
            this._savedColorsTarget = null;
            this._savedColorsEditing = false;
          }
          if (this._effectsTarget) {
            this._effectsTarget = null;
            this._effectsEditMode = false;
            this._effectsPopupActiveOrder = [];
          }
          // Stefan-2026-05-16 PA-0001 (scenes_list): same outside-click
          // close-path as the effects popup. PA-0005: reset edit-mode +
          // active-order so reopening starts clean.
          if (this._scenesTarget) {
            this._scenesTarget = null;
            this._scenesEditMode = false;
            this._scenesPopupActiveOrder = [];
          }
        }
        // Whether we closed the popup or the click was inside it, we do NOT
        // run compact-collapse on this same event.
        return;
      }

      // Compact-mode collapse on outside-click. Only reachable when no
      // popup is open. Collapse when the click DID NOT land on any
      // interactive surface (a tile, the mode-picker overlay, an
      // inplace-popup, or a slider). Gated by the popup-suppression window
      // so the phantom click from the long-press that just expanded the
      // view doesn't collapse it.
      //
      // Stefan-2026-05-12 PA-0002 (R2a): under sticky-expansion, OUTSIDE-
      // CLICK NEVER COLLAPSES. The user must explicitly fold via the
      // long-press mode-picker → "Collapse" slot. Stefan-Quote: "when
      // this card is expanded then only tapping outside of the card should
      // close the expansion (or lets make it so, that the expansion state
      // is remembered. that is better. ... If it is not the mode picker
      // needs to have an option to collapse the node." — sticky-expansion
      // is the "remembered" branch and inverts the tap-outside semantic.
      if (this.expansionSticky) return;
      if (this._compactExpanded && !withinSuppression) {
        // Stefan-2026-05-12 R333 (PA-0012): when a popup is open ANYWHERE
        // on the page (could be a wheel/saved/parallel-popup hosted by a
        // SIBLING card instance, since popups mount at document.body via
        // portal), AND the user is tapping INSIDE the card chrome, treat
        // this as a popup-dismissal — close the popup (other instance's
        // listener will do that) and KEEP our expansion. Only collapse
        // when the click is truly outside any card. Stefan-Quote: "only
        // the pop up should close, the expanded mindmap should only close
        // when you press outside of the card".
        //
        // The portal sets `pointer-events: none` on the wrapper so clicks
        // outside popup elements pass through to whatever's behind. If
        // that's a card chrome (the back-card containing our nested
        // group-layouts), the click hits an `ha-card` in its composed
        // path. If it's truly empty dashboard background, no `ha-card`
        // appears in the path → fall through to the collapse check.
        const anyPopupOpen = !!document.querySelector(
          '.inplace-popup, .parallel-popup, .topology-popup',
        );
        if (anyPopupOpen) {
          const inHaCard = path.some((n) => {
            const el = n as Element | undefined;
            return typeof el?.tagName === 'string' && el.tagName === 'HA-CARD';
          });
          if (inHaCard) return;
        }

        const onInteractive = path.some((n) => {
          const el = n as Element | undefined;
          if (!el) return false;
          const cls = el.classList;
          if (cls?.contains?.('tile')) return true;
          if (cls?.contains?.('picker-overlay')) return true;
          if (cls?.contains?.('inplace-popup')) return true;
          const tag = typeof el.tagName === 'string' ? el.tagName.toLowerCase() : '';
          if (tag === 'everyday-vertical-pill-slider') return true;
          return false;
        });
        if (!onInteractive) {
          this._compactExpanded = false;
        }
      }
    };
    // Capture phase so we see the click before component handlers can stop it.
    document.addEventListener('click', this._outsideClickListener, true);
  }

  private _removeOutsideClickListener(): void {
    if (!this._outsideClickListener) return;
    document.removeEventListener('click', this._outsideClickListener, true);
    this._outsideClickListener = undefined;
  }

  private _showToast(msg: string): void {
    this._toast = msg;
    if (this._toastTimer !== null) clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => {
      this._toast = null;
      this._toastTimer = null;
    }, 2400);
  }

  private _modeFor(entityId: string): SliderMode {
    return this._memberModes[entityId] ?? 'brightness';
  }

  /**
   * Set a member's slider mode AND fire the side-effect service call when the
   * new mode requires the light to actually drive its colour state. Today
   * this only matters for `'temperature'` (Stefan-2026-05-08): activating
   * temp mode should immediately repaint the light to the previously-stored
   * kelvin value (or 3500 K as a sensible default for first-time temp users).
   * brightness/hue/saturation modes don't need this because the slider's own
   * pointer-down already drives the light when the user actually drags.
   */
  private _setMemberMode(entityId: string, newMode: SliderMode): void {
    this._memberModes = { ...this._memberModes, [entityId]: newMode };
    if (newMode === 'temperature' && this._isMemberOn(entityId) && this.hass) {
      const target = this._memberLastTemp[entityId] ?? 3500;
      void this.hass.callService('light', 'turn_on', {
        entity_id: entityId,
        color_temp_kelvin: target,
      });
    }
  }

  /**
   * Stefan-2026-05-11 R253: leaf-count of a member, used to weight the
   * `.member-cols` grid columns so deeper subtrees get more horizontal
   * space. Bare-string members weigh 1. Nested members weigh the sum of
   * their `manual_members` leaf weights (recursive). Falls back to 1 when
   * the nested member has no explicit `manual_members` (auto-resolves via
   * the entity's HA group state — could refine to count those too, but 1
   * is a safe default since we don't know the depth without DOM access).
   */
  /**
   * Stefan-2026-05-12 R334 (PA-0015): aggregate THIS card's current
   * visible-leaf-count, used as the payload of the `visible-leaf-count-
   * change` event dispatched to parent group-layouts. The parent reads
   * this number to size its own col-fr-share for THIS child.
   *
   * Computation:
   *   - Compact + collapsed (compact && !_compactExpanded) → 1 (single
   *     compact tile is showing, no expanded sliders).
   *   - Otherwise (compact + expanded, or non-compact = fully expanded):
   *     sum over each member of `_memberLeafWeight(id)`, which itself
   *     consults the runtime cache for nested children before falling
   *     back to static config counts. Recursion stops at bare-string
   *     members (= 1 leaf each).
   *
   * This is the public-ish surface for the parent. The event detail
   * carries the result, so the parent doesn't need to query our DOM.
   */
  private _currentVisibleLeafCount(): number {
    if (this.compact && !this._compactExpanded) return 1;
    if (!this.memberIds || this.memberIds.length === 0) return 1;
    let total = 0;
    for (const id of this.memberIds) {
      total += this._memberLeafWeight(id);
    }
    return Math.max(1, total);
  }

  /**
   * Stefan-2026-05-12 R334 (PA-0015): handler for the
   * `visible-leaf-count-change` event bubbled up from a nested embedded
   * child. Stops propagation here so the original event doesn't reach
   * THIS card's own parent — instead, our own `updated()` lifecycle will
   * dispatch a FRESH aggregated event upward carrying our recomputed
   * total (which now accounts for the child's new count).
   */
  private _onChildVisibleLeafCountChange(memberId: string, ev: Event): void {
    ev.stopPropagation();
    const detail = (ev as CustomEvent<{ count?: number }>).detail;
    const count = detail?.count;
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 1) return;
    const prev = this._childVisibleLeafCounts.get(memberId);
    if (prev === count) return;
    const next = new Map(this._childVisibleLeafCounts);
    next.set(memberId, count);
    this._childVisibleLeafCounts = next;
  }

  private _memberLeafWeight(memberId: string): number {
    // Stefan-2026-05-12 R334 (PA-0015): RUNTIME visible-leaf-count wins when
    // available. The embedded child (everyday-light-card → its inner
    // everyday-group-layout-expanded) dispatches `visible-leaf-count-change`
    // events whenever its `_compactExpanded` flips (or recursive children
    // change). The cached count reflects the actual number of visible-leaf
    // sliders that child is currently rendering. With this, when bathroom
    // is inline-expanded its weight jumps from 1 (compact) to 3 (visible
    // leaves), and the parent's grid-template-columns redistributes so the
    // 5 total visible leaves get equal-pitch slots across the card width
    // (each col-share = visibleLeaves/totalVisible * containerWidth).
    //
    // Falls back to the static config-aware count when the child hasn't
    // reported yet (initial render before the first event) — that count
    // now also respects `group.layout: 'compact'` (see _countLeavesForEntity).
    const runtime = this._childVisibleLeafCounts.get(memberId);
    if (typeof runtime === 'number') return runtime;
    const nestedConfig = this.memberConfigs.get(memberId);
    return this._countLeavesForEntity(
      memberId,
      nestedConfig?.group?.manual_members,
      0,
      nestedConfig?.group?.layout,
    );
  }

  /**
   * Stefan-2026-05-11 R278 (PA-13 follow-up to R276): recursively count the
   * actual rendered leaf-count of a group. Walks the manual_members config
   * tree when available, and falls back to HA-state `attributes.entity_id`
   * when the manual_members entry is missing at any depth. Pre-R278 logic
   * only descended through the config tree — a group with
   * `group: { layout: expanded }` and no manual_members counted as 1 even
   * when it had 6 children at runtime. Side-effect: outer 8fr/1fr split
   * collapsed Main to ~12% of card width and Stefan PA-13 saw "Main steht
   * vollkommen alleine da". Hard cap at depth 10 guards against cyclic
   * group references.
   *
   * NOTE: takes both the entity ID AND the manual_members config explicitly
   * because `this.memberConfigs` only holds the CURRENT level's children;
   * nested levels can't look themselves up there. We pass the config sub-
   * tree down via the recursion arg instead.
   */
  private _countLeavesForEntity(
    entityId: string,
    manualMembers: ManualMember[] | undefined,
    level: number,
    layout?: 'compact' | 'expanded' | 'auto',
  ): number {
    if (level > 10) return 1;
    // Stefan-2026-05-12 R334 (PA-0015): compact-layout members render as
    // a single tile regardless of subtree size. Returning 1 here gives the
    // PARENT's gridTemplateColumns the correct "visible-leaves at THIS
    // state" weight. Pre-R334 the recursion always returned the full
    // subtree count, so a compact bathroom (1 tile visible) got the same
    // 3fr col-share as an expanded bathroom (3 tiles visible) — making
    // sibling-compact-kitchen look unfairly cramped in 2fr while
    // showing only 1 tile too. Stefan PA-0015: "they should be evenly
    // spaced at each step of the expansion".
    //
    // When the runtime later expands the compact child, its
    // visible-leaf-count event will override this fallback via the
    // _childVisibleLeafCounts cache (see _memberLeafWeight).
    if (layout === 'compact') return 1;
    if (manualMembers && manualMembers.length > 0) {
      let total = 0;
      for (const m of manualMembers) {
        if (typeof m === 'string') {
          total += this._countLeavesForEntity(m, undefined, level + 1);
        } else if (m.entity) {
          // Stefan-2026-05-12 R334 (PA-0015): pass the nested layout so deep
          // compact descendants short-circuit at this level too. Without
          // this, a deep tree of compact members would still bubble up
          // full leaf-counts and over-allocate fr-shares at every parent.
          total += this._countLeavesForEntity(
            m.entity,
            m.group?.manual_members,
            level + 1,
            m.group?.layout,
          );
        }
      }
      return total;
    }
    // No manual_members at this level — resolve via HA group state
    const childIds = this.hass?.states[entityId]?.attributes?.entity_id;
    if (Array.isArray(childIds) && childIds.length > 0) {
      let total = 0;
      for (const subId of childIds) {
        total += this._countLeavesForEntity(subId, undefined, level + 1);
      }
      return total;
    }
    return 1;
  }

  /**
   * Cycle the slider mode for a given member based on the light's reported
   * color_mode and the current slider mode (Stefan 2026-05-08):
   *   color_temp light:  brightness ↔ temperature
   *   color light:       brightness → hue → saturation → brightness
   * If the light is in a mode we don't recognize (or off), fall back to
   * brightness.
   */
  private _cycleNextMode(entityId: string): SliderMode {
    const state = this.hass?.states[entityId];
    const colorMode = state?.attributes?.color_mode as string | undefined;
    const current: SliderMode = this._memberModes[entityId] ?? 'brightness';
    // Stefan-2026-05-10 P15.6-r48 (R229): user-defined cycle list takes
    // precedence over color_mode heuristic. Step to the next entry,
    // wrapping to index 0 at the end. If `current` isn't in the list
    // (entity changed mode externally), start from index 0.
    if (this.cycleModes && this.cycleModes.length > 0) {
      const idx = this.cycleModes.indexOf(current);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % this.cycleModes.length;
      return this.cycleModes[nextIdx];
    }
    if (colorMode === 'color_temp') {
      return current === 'brightness' ? 'temperature' : 'brightness';
    }
    // hs / xy / rgb / rgbw / rgbww — color path
    switch (current) {
      case 'brightness': return 'hue';
      case 'hue':        return 'saturation';
      case 'saturation': return 'brightness';
      default:           return 'brightness';
    }
  }

  // ---------- compact-mode (P8) ----------

  private _renderCompact(): TemplateResult {
    const groupOn = this._isGroupOn();
    const groupId = this.groupEntityId;
    const groupPickerActive = this._compactGroupPicker.pickerOpen;
    // Stefan-2026-05-10 R150: read entity-icon (e.g. user-customised
    // `mdi:track-light` for hall_spots) instead of hardcoded mdi:ceiling-light.
    // Stefan-2026-05-11 R275 (PA-13 Issue 6): _groupIcon() prefers
    // user-config-icon over the entity-registry icon. Without this fix,
    // `light.everyday_all` + `icon: mdi:home-lightbulb` rendered the
    // registry icon and silently dropped the user's override.
    const groupIcon = this._groupIcon('mdi:ceiling-light');
    // Stefan-2026-05-11 P15.6-r63f (R305 / PA-0033): compact-glyph inline
    // color via the same icon_color cascade as the expanded view. Reads
    // the group entity's own state (rgb_color + brightness) when
    // 'on-state'. Empty string preserves CSS theming (themed gold via
    // R304 unified chain).
    const compactGroupState = this.hass?.states[groupId];
    const compactGroupRgb = compactGroupState?.attributes.rgb_color as [number, number, number] | undefined;
    const compactGroupBri = compactGroupState?.attributes.brightness as number | undefined;
    const compactGroupIconStyle = computeIconStateColor(this.iconColor, groupOn, compactGroupRgb, compactGroupBri);
    // Stefan-2026-05-12 P15.6-r63i (R311 / PA-0039): compact-tile ring color
    // now mirrors the expanded view's SVG groupDot stroke logic (mindmap-
    // path.ts:579-584). Pre-r63i the .ic had a HARDCODED gold border via
    // CSS, which never reflected the entity's RGB even when on — Stefan-Quote:
    // "the dot around the icon is not the same color as in the expanded view.
    // it must be the same as if it were the extended view." Branching:
    //   off → faint gray (--disabled-color)
    //   on + rgb_color → rgba(R,G,B)
    //   otherwise → themed gold (--mindmap-group-stroke fallback #f4b91d)
    let compactRingColor = 'var(--mindmap-group-stroke, #f4b91d)';
    if (!groupOn) {
      compactRingColor = 'var(--disabled-color, rgba(150, 150, 150, 0.55))';
    } else if (compactGroupRgb && compactGroupRgb.length === 3) {
      compactRingColor = `rgba(${compactGroupRgb[0]}, ${compactGroupRgb[1]}, ${compactGroupRgb[2]}, 1)`;
    }
    const compactIcRingStyle = `border-color: ${compactRingColor};`;
    // Compact slider's mode is reactive to _memberModes[groupId] so the
    // group-picker's Temp option (Stefan-2026-05-09) can flip the slider
    // into temperature mode without losing the brightness mode default.
    const compactSliderMode = (this._memberModes[groupId] ?? 'brightness') as SliderMode;
    // Order depends on iconPosition. 'bottom' (default) = original P5
    // compact: slider on top, group icon below. 'top' = group icon on top,
    // slider below (anchors group-Y on expand, opt-in via config).
    const groupTile = html`
      <div class="group-row">
        <div
          class="tile group compact-target ${groupOn ? 'on' : 'off'} ${groupPickerActive ? 'lp' : ''}"
          role="button"
          tabindex="0"
          @click=${(ev: Event) => {
            // Stefan-2026-05-09-late: defensive no-op. Browser fires native
            // click events for every tap, including each tap of a
            // double-tap. We route taps via gesture-detector's onTap (which
            // suppresses on double-tap), so this @click only exists to
            // SWALLOW the native click events at the tile boundary so they
            // never bubble up or trigger ancestors.
            ev.stopPropagation();
            ev.preventDefault();
          }}
          @keydown=${(ev: KeyboardEvent) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              this._onGroupTap(ev);
            }
          }}
        >
          <div class="ic" style=${compactIcRingStyle}>
            <!-- Stefan-2026-05-10 R158: ha-state-icon for proper
                 entity-registry icon resolution.
                 Stefan-2026-05-11 P15.6-r63f (R305): inline color
                 from icon_color cascade — uniform with expanded view.
                 Stefan-2026-05-12 P15.6-r63i (R311): parent .ic gets
                 inline border-color so the ring tracks entity state
                 (off=gray, on+rgb=RGB, otherwise themed gold). Matches
                 the expanded-view SVG groupDot stroke (mindmap-path.ts). -->
            <ha-state-icon
              class="compact-glyph"
              style=${compactGroupIconStyle}
              .hass=${this.hass}
              .stateObj=${this.hass?.states[groupId]}
              .icon=${groupIcon}
            ></ha-state-icon>
          </div>
          <div class="lbl">${this._groupName()}</div>
          <!-- Stefan-2026-05-12 P15.6-r63i (R310 / PA-0039): R274's
               compact-state-line removed. Stefan-Quote: "i dont understand
               why this config shows the label 'on'. it does not make any
               sense. Where does the 'on' come from? remove it". The state
               is already conveyed via icon-color (on-state cascade) — no
               need for a redundant text glyph that just says "on" / "off". -->
          ${groupPickerActive
            ? html`<div class="picker-overlay">${this._compactGroupPicker.renderPicker()}</div>`
            : null}
        </div>
      </div>
    `;
    // Stefan-2026-05-09 P41-R8-revert: dropped the slider-bottom mindmap-hint
    // icon. The mindmap option lives only in the long-press picker now.
    // P45 R25: when the topology-popup is open, the compact slider goes
    // visibility:hidden so the popup at the same on-screen position can
    // visually replace it. The layout slot stays reserved (no reflow).
    const sliderHiddenClass = this._topologyPopupOpen ? 'popup-hidden' : '';
    const sliderTile = html`
      <div class="compact-slider ${sliderHiddenClass}">
        <everyday-vertical-pill-slider
          class="compact-slider-el"
          .hass=${this.hass}
          .entity=${groupId}
          .mode=${compactSliderMode}
        ></everyday-vertical-pill-slider>
      </div>
    `;

    // Stefan-2026-05-11 R274 (PA-13 Issue 5): compact-group must visually
    // match a single-light tile. Stefan-Quote: "diese config (hall_spots,
    // compact) muss genauso aussehen wie diese (hall_spot_1)". Single-light
    // has [slider, icon-circle, name, state] in a tight tile (no min-height,
    // no arm decoration). Drop the compact-mindmap-arm here; the standalone
    // (non-embedded) standalone styling collapses the min-height + matches
    // the .caption .single-icon circle via CSS. State-line + name now live
    // INSIDE the .tile.group so they share the tile's 2 px gap.
    //
    // Stefan-2026-05-12 PA-0002: thread `sliderHeight` config into the
    // compact view via inline `--everyday-slider-height` on `.layout`.
    // Pre-PA-0002 `slider.height` config only applied to the expanded
    // view (via `_renderTopologyTree`'s inline-style); the compact-
    // collapsed slider always rendered at the hardcoded 220 (now 270)
    // styles.ts fallback regardless of user override. Stefan-Quote
    // (config2.txt repro): `group.layout: compact, slider.height: 270`
    // expected a 270 px compact slider — got 220 because nothing in the
    // compact render path threaded the prop into the CSS var.
    const compactLayoutStyle = this.sliderHeight
      ? `--everyday-slider-height: ${this.sliderHeight}px`
      : '';
    return html`
      <div class="layout compact" style=${compactLayoutStyle}>
        ${this.iconPosition === 'top'
          ? html`${groupTile}${sliderTile}`
          : html`${sliderTile}${groupTile}`}
      </div>
    `;
  }

  /**
   * Bind the compact-collapsed group tile to its `PickerController`
   * (Stefan-2026-05-10 P15.6). The controller handles tap → group-toggle,
   * double-tap → slider-mode cycle, and long-press → 4-option picker
   * (Wheel/Temp/Saved/Mindmap) all configured at field-init time.
   * `bindIcon(null)` disposes the binding when the compact view leaves
   * the screen (e.g. while the inline-expanded view is showing).
   */
  private _bindCompactGestures(): void {
    if (!this.compact || this._compactExpanded) {
      this._compactGroupPicker.bindIcon(null);
      return;
    }
    const groupTile = this.renderRoot.querySelector(
      '.tile.group.compact-target',
    ) as HTMLElement | null;
    this._compactGroupPicker.bindIcon(groupTile);
  }

  /**
   * Bind the long-press → mode-picker gesture on the EXPANDED-view group tile
   * via the shared `PickerController` (Stefan-2026-05-10 P15.5). The
   * controller owns gesture detection, picker overlay rendering, and the
   * pickerHover state machine. We call `bindIcon(tile)` here on every
   * expanded-view re-render and `bindIcon(null)` to dispose when collapsed.
   * Tap → groupToggleWithRestore via `onTap` override; mode-pick → host's
   * body-portal popup machinery via `onModePicked` override.
   */
  private _bindExpandedGroupGestures(): void {
    if (this.compact && !this._compactExpanded) {
      this._expandedGroupPicker.bindIcon(null);
      return;
    }
    const groupTile = this.renderRoot.querySelector(
      '.topology .tile.group',
    ) as HTMLElement | null;
    this._expandedGroupPicker.bindIcon(groupTile);
  }

  // ---------- render ----------

  protected render(): TemplateResult {
    // Stefan-2026-05-12 P15.6-r63l (R318 / PA-0043): allow rendering without
    // `groupEntityId` when used as a CONTAINER (compound card path). The
    // groupEntityId guard pre-r63l prevented entity:none + manual_members
    // from rendering at all. memberIds presence is the real signal that
    // there's something to draw — keep that check.
    if (!this.hass || this.memberIds.length === 0) {
      return html`<div class="placeholder">Group not yet resolved.</div>`;
    }

    if (this.compact && !this._compactExpanded) {
      return this._renderCompact();
    }

    // Inline-expand path delegates to the same _renderTopologyTree helper
    // the popup uses. Single source of truth for layout (Stefan-2026-05-09
    // P44 R23 fix) ensures the popup looks identical to inline-expand.
    return html`
      ${this._renderTopologyTree()}
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : null}
    `;
  }

  // Stefan-2026-05-10 P15-Phase-2 r33a: 361 LOC of CSS extracted to
  // ./group-layout-expanded.styles.ts. Same content, separate module.
  static styles: CSSResult = GROUP_LAYOUT_EXPANDED_STYLES;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-group-layout-expanded': EverydayGroupLayoutExpanded;
  }
}
