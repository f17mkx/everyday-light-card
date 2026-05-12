/**
 * everyday-light-card-editor - Lovelace visual editor.
 *
 * Stefan-2026-05-10 P15.6-r42 (R206): minimum-viable editor that lets
 * users configure the most-common card options without touching YAML.
 * Schema-driven via HA's `<ha-form>` component (available globally in
 * any HA frontend), so we get HA-styled entity-pickers, multi-selects
 * with drag-reorder, and HA's standard form layout for free.
 *
 * Coverage:
 *   - entity (light.* or media_player.*)
 *   - name (override)
 *   - icon (override mdi:*)
 *   - default_view_mode (slider / parallel / effects-picker)
 *   - group.layout (compact / expanded)
 *   - group.manual_members (multi-entity with reorder)
 *
 * Out-of-scope (stay YAML-only — power-user knobs):
 *   - parallel_sliders.modes / show_labels / full_length
 *   - color_wheel / saved_colors / effects_picker source config
 *   - gestures.* per-event action mapping
 *   - slider.width / height / orientation / style
 *   - gestures.long_press_ms tuning
 *
 * HA's UI exposes a "show code editor" toggle that lets users edit the
 * raw YAML for the out-of-scope fields. Round-trips cleanly because we
 * preserve unknown config keys via spread on every `value-changed`.
 */

import { LitElement, html, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';

import type { EverydayLightCardConfig, GestureAction } from '../types/config.js';

interface HaFormSchemaItem {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
  default?: unknown;
}

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
   */
  private _flatData(): Record<string, unknown> {
    if (!this._config) return {};
    const ps = this._config.parallel_sliders;
    const slider = this._config.slider;
    const dt =
      this._config.gestures?.member_icon?.double_tap
      ?? this._config.gestures?.group_icon?.double_tap
      ?? '';
    return {
      entity: this._config.entity ?? '',
      name: this._config.name ?? '',
      icon: this._config.icon ?? '',
      default_view_mode: this._config.default_view_mode ?? '',
      group_layout: this._config.group?.layout ?? '',
      manual_members: this._config.group?.manual_members ?? [],
      parallel_modes: ps?.modes ?? [],
      parallel_full_length: ps?.full_length === true,
      slider_orientation: slider?.orientation ?? '',
      slider_style: slider?.style ?? '',
      slider_height: slider?.height ?? 0,
      double_tap_action: dt,
    };
  }

  /**
   * The schema for ha-form. Each item maps to a UI field. `selector` keys
   * tell HA which input widget to render — entity-picker, multi-entity
   * picker (drag-reorder), text, dropdown.
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
      {
        name: 'default_view_mode',
        selector: {
          select: {
            options: [
              { value: '', label: 'Default (slider)' },
              { value: 'parallel', label: 'Parallel (4-axis)' },
              { value: 'effects-picker', label: 'Effects list' },
            ],
            mode: 'dropdown',
          },
        },
      },
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
      // Stefan-2026-05-10 P15.6-r46 (R225): parallel-inline knobs.
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
      {
        name: 'parallel_full_length',
        selector: { boolean: {} },
      },
      // Stefan-2026-05-10 P15.6-r46 (R225): slider styling knobs.
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
      // Stefan-2026-05-10 P15.6-r46 (R225): primary gesture action.
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
              { value: 'classic_more_info', label: 'HA more-info dialog' },
              { value: 'toggle', label: 'Toggle entity' },
            ],
            mode: 'dropdown',
          },
        },
      },
    ];
  }

  /**
   * Translation for ha-form labels. Falls back to the field name when no
   * translation exists. This is the standard pattern HA uses across
   * its built-in editors.
   */
  private _computeLabel = (item: HaFormSchemaItem): string => {
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
      // Stefan-2026-05-10 P15.6-r46 (R225): expanded-editor labels.
      parallel_modes: 'Parallel slider modes (when view = parallel)',
      parallel_full_length: 'Parallel sliders use full length (260 px)',
      slider_orientation: 'Slider orientation',
      slider_style: 'Slider style',
      slider_height: 'Slider height (px, 0 = default)',
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
      next.default_view_mode = flat.default_view_mode as 'parallel' | 'effects-picker';
    } else {
      delete next.default_view_mode;
    }
    // Group sub-config: only set when at least one group field has a value.
    const groupLayout = flat.group_layout as 'compact' | 'expanded' | '' | undefined;
    const manualMembers = flat.manual_members as string[] | undefined;
    if (groupLayout || (manualMembers && manualMembers.length > 0)) {
      next.group = {
        ...this._config.group,
      };
      if (groupLayout) next.group.layout = groupLayout as 'compact' | 'expanded';
      else delete next.group.layout;
      if (manualMembers && manualMembers.length > 0) next.group.manual_members = manualMembers;
      else delete next.group.manual_members;
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
          For advanced options (parallel_sliders, gestures, color_wheel, saved_colors,
          effects_picker, slider styling), toggle <strong>Show code editor</strong>
          in the top-right of this dialog and edit the YAML directly.
          Round-trip is preserved — switching back to the visual editor keeps
          your YAML edits.
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
