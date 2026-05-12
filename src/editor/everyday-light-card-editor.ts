/**
 * everyday-light-card-editor - Lovelace visual editor.
 *
 * Stefan-2026-05-10 P15.6-r42 (R206): minimum-viable editor that lets
 * users configure the most-common card options without touching YAML.
 * Schema-driven via HA's `<ha-form>` component (available globally in
 * any HA frontend), so we get HA-styled entity-pickers, multi-selects
 * with drag-reorder, and HA's standard form layout for free.
 *
 * Stefan-2026-05-12 PA-0002 (R5 + R6): editor reorganized into expandable
 * sections + new knobs surfaced:
 *   - "Fixed card size" (expand_in_place) — group section.
 *   - "Remember expansion state" (expansion_sticky) — group section.
 *   - "Show effects in mode-picker" (effects_picker.in_picker) — picker
 *     section. Default OFF; Stefan-Quote: "by default the effects-list
 *     should be disabled in the mode-picker".
 *   - default_view_mode: removed 'effects-picker' option (Stefan-R283:
 *     "makes no sense, remove it!"); added 'color-wheel' + 'saved-colors'
 *     standalone-tile variants (already supported in the runtime, just
 *     hidden from the editor pre-PA-0002).
 *   - double-tap-action: added 'expand_group' (Stefan-R282: missing from
 *     the picker, only available via YAML pre-PA-0002).
 *
 * HA's UI exposes a "show code editor" toggle that lets users edit the
 * raw YAML for any field not surfaced here. Round-trips cleanly because
 * we preserve unknown config keys via spread on every `value-changed`.
 */

import { LitElement, html, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';

import type { EverydayLightCardConfig, GestureAction } from '../types/config.js';

/**
 * Stefan-2026-05-12 PA-0002 (R6): expandable schema items are HA's native
 * grouping mechanism (`type: 'expandable'`) — clicking the title folds the
 * group open/closed. iconPath optional. Items nest under `schema:`.
 *
 * Stefan-2026-05-12 R340 (PA-0017): added `flatten: true` requirement.
 * HA's <ha-form-expandable> nests child values under the section's `name`
 * key by DEFAULT. With our flat _flatData() shape, that nesting silently
 * dropped every input — typing "parallel" into default_view_mode emitted
 * `{ display_section: { default_view_mode: 'parallel' } }`, but
 * _valueChanged read flat.default_view_mode (top-level) → undefined →
 * deleted the value. Result: nothing the user typed ever stuck.
 * `flatten: true` makes the expandable spread its children's values at
 * the parent level on read AND write. Source: ha-form-expandable.ts in
 * home-assistant/frontend (master) — `if (this.schema.flatten) { spread }`.
 */
interface HaFormBaseItem {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
  default?: unknown;
}
interface HaFormExpandable {
  name: string;
  type: 'expandable';
  title: string;
  iconPath?: string;
  expanded?: boolean;
  /**
   * Spread child values at the parent's level (vs nesting under `name`).
   * REQUIRED for our flat `_flatData()` shape — see the typedoc above.
   */
  flatten?: boolean;
  schema: HaFormSchemaItem[];
}
type HaFormSchemaItem = HaFormBaseItem | HaFormExpandable;

@customElement('everyday-light-card-editor')
export class EverydayLightCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: EverydayLightCardConfig;

  public setConfig(config: EverydayLightCardConfig): void {
    this._config = config;
  }

  /**
   * Flatten the nested config shape into a flat data-object for ha-form.
   * ha-form's value-changed event gives us back the same flat shape; we
   * un-flatten in `_valueChanged` before re-emitting `config-changed`.
   * Stefan-2026-05-10 P15.6-r46 (R225): expanded from 6 to 12 fields.
   * Stefan-2026-05-12 PA-0002 (R5+R6): added 3 new flags.
   */
  private _flatData(): Record<string, unknown> {
    if (!this._config) return {};
    const ps = this._config.parallel_sliders;
    const slider = this._config.slider;
    const group = this._config.group;
    const effects = this._config.effects_picker;
    const dt =
      this._config.gestures?.member_icon?.double_tap
      ?? this._config.gestures?.group_icon?.double_tap
      ?? '';
    return {
      entity: this._config.entity ?? '',
      name: this._config.name ?? '',
      icon: this._config.icon ?? '',
      default_view_mode: this._config.default_view_mode ?? '',
      group_layout: group?.layout ?? '',
      manual_members: group?.manual_members ?? [],
      // Stefan-2026-05-12 PA-0002 (R5): "Fixed card size" knob — the user-
      // facing name for `expand_in_place` (Stefan-Quote: "must be an option
      // for 'fixed card size' (this is what i meant with full_length_sliders
      // =false)"). YAML key stays `expand_in_place` for backwards-compat.
      expand_in_place: group?.expand_in_place === true,
      // Stefan-2026-05-12 PA-0002 (R2a): per-card sticky expansion toggle.
      expansion_sticky: group?.expansion_sticky === true,
      parallel_modes: ps?.modes ?? [],
      parallel_full_length: ps?.full_length === true,
      slider_orientation: slider?.orientation ?? '',
      slider_style: slider?.style ?? '',
      slider_height: slider?.height ?? 0,
      // Stefan-2026-05-12 PA-0002 (R1): mode-picker effects-slot opt-in.
      effects_in_picker: effects?.in_picker === true,
      double_tap_action: dt,
    };
  }

  /**
   * Stefan-2026-05-12 PA-0002 (R6): schema reorganized into expandable
   * sections (Entity / Display / Group / Slider / Parallel / Picker /
   * Gestures). Each section folds independently; common knobs (entity,
   * name) stay top-level so first-paint of the editor is immediately
   * actionable for new users.
   */
  private _schema(): HaFormSchemaItem[] {
    return [
      {
        name: 'entity',
        required: true,
        selector: { entity: { domain: ['light', 'media_player'] } },
      },
      { name: 'name', selector: { text: {} } },
      { name: 'icon', selector: { icon: {} } },
      // Stefan-2026-05-12 PA-0002 (R6): Display section — view mode is the
      // primary structural decision so it sits at the top of the foldable
      // sections.
      {
        name: 'display_section',
        type: 'expandable',
        title: 'Display',
        expanded: true,
        flatten: true,
        schema: [
          {
            name: 'default_view_mode',
            selector: {
              select: {
                options: [
                  { value: '', label: 'Default (slider)' },
                  { value: 'parallel', label: 'Parallel (multi-axis)' },
                  // Stefan-2026-05-12 PA-0002 (R6 / Stefan-R283):
                  // 'effects-picker' removed from this dropdown.
                  // Stefan-Quote: "Remove 'effects list' view-mode from
                  // visual editor. makes no sense, remove it!". YAML key
                  // still supported in the runtime for any existing
                  // config that depends on it.
                  { value: 'color-wheel', label: 'Color wheel (standalone tile)' },
                  { value: 'saved-colors', label: 'Saved colors (standalone tile)' },
                ],
                mode: 'dropdown',
              },
            },
          },
        ],
      },
      // Stefan-2026-05-12 PA-0002 (R6): Group section — every group-related
      // knob lives here. Sticky-expansion + fixed-card-size + layout +
      // members all influence what the card renders for multi-light setups.
      {
        name: 'group_section',
        type: 'expandable',
        title: 'Group',
        flatten: true,
        schema: [
          {
            name: 'group_layout',
            selector: {
              select: {
                options: [
                  { value: '', label: 'Auto (expanded for groups)' },
                  { value: 'compact', label: 'Compact (single tile)' },
                  { value: 'expanded', label: 'Expanded (all members)' },
                ],
                mode: 'dropdown',
              },
            },
          },
          {
            name: 'manual_members',
            selector: {
              entity: { multiple: true, domain: 'light' },
            },
          },
          // Stefan-2026-05-12 PA-0002 (R5): "Fixed card size" — when on,
          // expanding a compact card doesn't grow the card; child sliders
          // shrink instead. Wires to `group.expand_in_place`.
          { name: 'expand_in_place', selector: { boolean: {} } },
          // Stefan-2026-05-12 PA-0002 (R2a): sticky expansion persistence.
          { name: 'expansion_sticky', selector: { boolean: {} } },
        ],
      },
      // Stefan-2026-05-12 PA-0002 (R6): Slider section.
      {
        name: 'slider_section',
        type: 'expandable',
        title: 'Slider',
        flatten: true,
        schema: [
          {
            name: 'slider_orientation',
            selector: {
              select: {
                options: [
                  { value: '', label: 'Default (vertical)' },
                  { value: 'vertical', label: 'Vertical' },
                  { value: 'horizontal', label: 'Horizontal' },
                ],
                mode: 'dropdown',
              },
            },
          },
          {
            name: 'slider_style',
            selector: {
              select: {
                options: [
                  { value: '', label: 'Default (pill)' },
                  { value: 'pill', label: 'Pill' },
                  { value: 'mixer', label: 'Mixer (speaker rows)' },
                ],
                mode: 'dropdown',
              },
            },
          },
          {
            name: 'slider_height',
            selector: { number: { min: 100, max: 400, step: 10, mode: 'box' } },
          },
        ],
      },
      // Stefan-2026-05-12 PA-0002 (R6): Parallel section — only meaningful
      // when default_view_mode is 'parallel' but harmless to expose
      // unconditionally (HA renders these as standalone widgets).
      {
        name: 'parallel_section',
        type: 'expandable',
        title: 'Parallel sliders',
        flatten: true,
        schema: [
          {
            name: 'parallel_modes',
            selector: {
              select: {
                multiple: true,
                options: [
                  { value: 'brightness', label: 'Brightness' },
                  { value: 'temperature', label: 'Temperature' },
                  { value: 'hue', label: 'Hue' },
                  { value: 'saturation', label: 'Saturation' },
                ],
                mode: 'list',
              },
            },
          },
          { name: 'parallel_full_length', selector: { boolean: {} } },
        ],
      },
      // Stefan-2026-05-12 PA-0002 (R6): Picker section — effects-in-picker
      // is the new opt-in flag (default off per Stefan-R1).
      {
        name: 'picker_section',
        type: 'expandable',
        title: 'Mode picker',
        flatten: true,
        schema: [
          { name: 'effects_in_picker', selector: { boolean: {} } },
        ],
      },
      // Stefan-2026-05-12 PA-0002 (R6): Gestures section — added
      // 'expand_group' to the double-tap dropdown (Stefan-R282 from
      // BACKLOG: missing option in the editor; only YAML-configurable
      // pre-PA-0002).
      {
        name: 'gestures_section',
        type: 'expandable',
        title: 'Gestures',
        flatten: true,
        schema: [
          {
            name: 'double_tap_action',
            selector: {
              select: {
                options: [
                  { value: '', label: 'Default (cycle mode)' },
                  { value: 'none', label: 'None' },
                  { value: 'cycle_mode', label: 'Cycle slider mode' },
                  { value: 'color_wheel', label: 'Open color wheel' },
                  { value: 'saved_colors', label: 'Open saved colors' },
                  { value: 'effects_list', label: 'Open effects list' },
                  { value: 'expand_group', label: 'Expand group (mindmap)' },
                  { value: 'classic_more_info', label: 'HA more-info dialog' },
                  { value: 'toggle', label: 'Toggle entity' },
                ],
                mode: 'dropdown',
              },
            },
          },
        ],
      },
    ];
  }

  /**
   * Translation for ha-form labels. Falls back to the field name when no
   * translation exists. This is the standard pattern HA uses across
   * its built-in editors.
   */
  private _computeLabel = (item: { name: string }): string => {
    const labels: Record<string, string> = {
      entity: 'Entity',
      name: 'Name override',
      icon: 'Icon override',
      default_view_mode: 'View mode',
      group_layout: 'Group layout',
      // Stefan-2026-05-10 P15.6-r45 (R218): label promised drag-to-reorder
      // but HA's `entity` selector with `multiple: true` doesn't ship with
      // a drag affordance — only add/remove. Order = order-of-addition.
      // Custom dnd-list widget tracked in BACKLOG (R218-followup).
      manual_members: 'Manual member entities (order = order-of-addition)',
      // Stefan-2026-05-12 PA-0002 (R5): "Fixed card size" — user-facing
      // label for `group.expand_in_place`. Stefan-Quote: "must be an option
      // for 'fixed card size'".
      expand_in_place: 'Fixed card size (stay same height when expanding)',
      // Stefan-2026-05-12 PA-0002 (R2a): sticky expansion label.
      expansion_sticky: 'Remember expansion state (sticky, requires manual collapse)',
      // Stefan-2026-05-10 P15.6-r46 (R225): expanded-editor labels.
      parallel_modes: 'Parallel slider modes (when view = parallel)',
      parallel_full_length: 'Parallel sliders use full length',
      slider_orientation: 'Slider orientation',
      slider_style: 'Slider style',
      slider_height: 'Slider height (px, 0 = default 270)',
      // Stefan-2026-05-12 PA-0002 (R1): effects-in-picker label.
      effects_in_picker: 'Show effects in mode-picker (long-press radial menu)',
      double_tap_action: 'Double-tap action',
    };
    return labels[item.name] ?? item.name;
  };

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config) return;
    const flat = ev.detail.value as Record<string, unknown>;
    // Un-flatten back into the nested config shape. Preserve any keys
    // not exposed in the editor (parallel_sliders, gestures, etc.) so
    // round-trip through this editor doesn't drop power-user config.
    const next: EverydayLightCardConfig = {
      ...this._config,
      type: this._config.type ?? 'custom:everyday-light-card',
      entity: (flat.entity as string) || this._config.entity,
    };
    if (flat.name) next.name = flat.name as string;
    else delete next.name;
    if (flat.icon) next.icon = flat.icon as string;
    else delete next.icon;
    if (flat.default_view_mode) {
      next.default_view_mode = flat.default_view_mode as
        | 'parallel'
        | 'effects-picker'
        | 'color-wheel'
        | 'saved-colors';
    } else {
      delete next.default_view_mode;
    }
    // Group sub-config: only set when at least one group field has a value.
    // Stefan-2026-05-12 PA-0002 (R5 + R2a): expand_in_place / expansion_sticky
    // are part of the group sub-config too, so the existence check needs to
    // include them — otherwise toggling either ON without setting a layout
    // would silently drop the flag on the next round-trip.
    const groupLayout = flat.group_layout as 'compact' | 'expanded' | '' | undefined;
    const manualMembers = flat.manual_members as string[] | undefined;
    const expandInPlace = flat.expand_in_place as boolean | undefined;
    const expansionSticky = flat.expansion_sticky as boolean | undefined;
    if (
      groupLayout
      || (manualMembers && manualMembers.length > 0)
      || expandInPlace
      || expansionSticky
    ) {
      next.group = { ...this._config.group };
      if (groupLayout) next.group.layout = groupLayout as 'compact' | 'expanded';
      else delete next.group.layout;
      if (manualMembers && manualMembers.length > 0) next.group.manual_members = manualMembers;
      else delete next.group.manual_members;
      if (expandInPlace) next.group.expand_in_place = true;
      else delete next.group.expand_in_place;
      if (expansionSticky) next.group.expansion_sticky = true;
      else delete next.group.expansion_sticky;
      // If the group object is empty after un-setting, drop it entirely
      // so the YAML stays clean.
      if (Object.keys(next.group).length === 0) delete next.group;
    } else {
      delete next.group;
    }
    // Stefan-2026-05-10 P15.6-r46 (R225): un-flatten parallel_sliders
    // sub-config. Drop the entire object when modes is empty AND
    // full_length stayed default (false) so YAML stays clean.
    const parallelModes = flat.parallel_modes as string[] | undefined;
    const parallelFullLength = flat.parallel_full_length as boolean | undefined;
    if ((parallelModes && parallelModes.length > 0) || parallelFullLength) {
      next.parallel_sliders = {
        ...this._config.parallel_sliders,
      };
      if (parallelModes && parallelModes.length > 0) {
        next.parallel_sliders.modes = parallelModes as Array<
          'brightness' | 'temperature' | 'hue' | 'saturation'
        >;
      } else {
        delete next.parallel_sliders.modes;
      }
      if (parallelFullLength) next.parallel_sliders.full_length = true;
      else delete next.parallel_sliders.full_length;
      if (Object.keys(next.parallel_sliders).length === 0) {
        delete next.parallel_sliders;
      }
    } else {
      delete next.parallel_sliders;
    }
    // Stefan-2026-05-10 P15.6-r46 (R225): un-flatten slider sub-config.
    const sliderOrientation = flat.slider_orientation as
      | 'horizontal'
      | 'vertical'
      | ''
      | undefined;
    const sliderStyle = flat.slider_style as
      | 'pill'
      | 'mixer'
      | ''
      | undefined;
    const sliderHeight = flat.slider_height as number | undefined;
    if (sliderOrientation || sliderStyle || (sliderHeight && sliderHeight > 0)) {
      next.slider = {
        ...this._config.slider,
      };
      if (sliderOrientation) {
        next.slider.orientation = sliderOrientation as 'horizontal' | 'vertical';
      } else {
        delete next.slider.orientation;
      }
      if (sliderStyle) next.slider.style = sliderStyle as 'pill' | 'mixer';
      else delete next.slider.style;
      if (sliderHeight && sliderHeight > 0) next.slider.height = sliderHeight;
      else delete next.slider.height;
      if (Object.keys(next.slider).length === 0) delete next.slider;
    } else {
      delete next.slider;
    }
    // Stefan-2026-05-12 PA-0002 (R1): un-flatten effects_picker.in_picker.
    // Preserve other effects_picker fields (source, editable) via spread.
    const effectsInPicker = flat.effects_in_picker as boolean | undefined;
    if (effectsInPicker || this._config.effects_picker) {
      next.effects_picker = { ...this._config.effects_picker };
      if (effectsInPicker) next.effects_picker.in_picker = true;
      else delete next.effects_picker.in_picker;
      if (Object.keys(next.effects_picker).length === 0) delete next.effects_picker;
    } else {
      delete next.effects_picker;
    }
    // Stefan-2026-05-10 P15.6-r46 (R225): un-flatten gestures.member_icon
    // .double_tap. Picks the right slot based on whether the entity is
    // a group (group_icon) or a single light (member_icon). Single
    // lights get member_icon by default — same as the picker default.
    const dtAction = flat.double_tap_action as string | undefined;
    if (dtAction) {
      next.gestures = {
        ...this._config.gestures,
      };
      next.gestures.member_icon = {
        ...this._config.gestures?.member_icon,
        double_tap: dtAction as GestureAction,
      };
    } else if (this._config.gestures) {
      // Preserve other gesture config; only clean up if entire gestures
      // sub-config is empty.
      next.gestures = { ...this._config.gestures };
      if (next.gestures.member_icon?.double_tap) {
        next.gestures.member_icon = { ...next.gestures.member_icon };
        delete next.gestures.member_icon.double_tap;
        if (Object.keys(next.gestures.member_icon).length === 0) {
          delete next.gestures.member_icon;
        }
      }
      if (Object.keys(next.gestures).length === 0) delete next.gestures;
    }
    this._config = next;
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }),
    );
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html`<div class="placeholder">Loading editor...</div>`;
    }
    return html`
      <div class="form-wrap">
        <ha-form
          .hass=${this.hass}
          .data=${this._flatData()}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
        <p class="hint">
          For advanced options (color_wheel, saved_colors, effects_picker.source,
          gestures.long_press_ms, cycle.modes), toggle <strong>Show code editor</strong>
          in the top-right of this dialog and edit the YAML directly.
          Round-trip is preserved — switching back keeps your YAML edits.
        </p>
      </div>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
    }
    .form-wrap {
      padding: 12px 0;
    }
    .placeholder {
      padding: 16px;
      color: var(--secondary-text-color);
    }
    .hint {
      margin-top: 16px;
      padding: 12px;
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.04));
      border-left: 3px solid var(--primary-color);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--secondary-text-color);
    }
    .hint strong {
      color: var(--primary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-light-card-editor': EverydayLightCardEditor;
  }
}
