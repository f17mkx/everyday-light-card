/**
 * saved-colors-picker - Phase 7 deliverable, R6 + R7.
 *
 * Grid of saved-color swatches with two interaction modes:
 *
 *   default    Tap a swatch → fires `color-pick` { r, g, b }, parent applies
 *              `light.turn_on rgb_color`. Long-press a swatch → enters edit-mode.
 *   edit       All swatches wiggle. Each has a small `−` button at the
 *              top-right. A trailing `+` cell saves the active light's
 *              current rgb. After saving, the parent auto-exits edit-mode
 *              (one-shot add per session), so a separate ✓ exit button is
 *              unnecessary - tapping outside the popup or another long-press
 *              also dismiss / re-enter edit-mode.
 *
 * Layout matches the HA-Standard 2×4 grid Stefan called out in
 * PHASE-1-COMMENTS.md - the original Stefan-mocks were rated "bescheiden"
 * so we anchor on the HA-native more-info appearance instead.
 *
 * State is owned by the parent (group-layout-expanded). This component is
 * presentational + emits events:
 *   - `color-pick`     { r, g, b }                   tap on a swatch
 *   - `add-current`    {}                            tap on the + cell
 *   - `remove-color`   { index }                     tap on a − button
 *   - `done-editing`   {}                            tap on ✓
 *   - `enter-edit`     {}                            long-press on any swatch
 */

import { LitElement, html, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { attachGestures } from '../helpers/gesture-detector.js';

export type ColorTuple = [number, number, number];
/**
 * Saved-colors entry — Stefan-2026-05-10 P15.6-r39 (R201): legacy entries
 * are 3-element `[r, g, b]` arrays; kelvin entries are 4-element
 * `[r, g, b, k]` where the first 3 elements are the visual rgb
 * representation (for swatch render) AND the 4th element is the actual
 * kelvin value to apply on pick. The 3-tuple ↔ 4-tuple discrimination
 * keeps the persistence format JSON-array-shaped (same as before) and
 * back-compat with palettes saved before r39. Kelvin range typically
 * 1000..10000; values ≤ 0 are treated as "no kelvin override → fire
 * rgb_color as before".
 */
export type ColorEntry = ColorTuple | [number, number, number, number];

@customElement('everyday-saved-colors-picker')
export class EverydaySavedColorsPicker extends LitElement {
  @property({ attribute: false }) colors: ColorEntry[] = [];
  @property({ type: Boolean, attribute: 'edit-mode' }) editMode = false;

  private _gestureCleanups: Array<() => void> = [];

  override updated(): void {
    // Re-bind long-press detection to swatches after each render.
    for (const c of this._gestureCleanups) c();
    this._gestureCleanups = [];
    if (this.editMode) return; // long-press is only the edit-mode entry; once in edit-mode, taps select.
    const swatches = this.renderRoot.querySelectorAll('.swatch[data-idx]') as NodeListOf<HTMLElement>;
    swatches.forEach((el) => {
      const dispose = attachGestures(el, {
        onLongPress: () => {
          this.dispatchEvent(new CustomEvent('enter-edit', { bubbles: true, composed: true }));
        },
        onTap: () => {
          const idx = Number(el.dataset.idx);
          const c = this.colors[idx];
          if (!c) return;
          // Stefan-2026-05-10 P15.6-r39 (R201): 4-tuple entries carry a
          // kelvin override at index 3. Pass it through so the host can
          // fire `light.turn_on color_temp_kelvin: k` instead of rgb.
          const k = c.length === 4 ? c[3] : undefined;
          this.dispatchEvent(
            new CustomEvent('color-pick', {
              detail: { r: c[0], g: c[1], b: c[2], k },
              bubbles: true,
              composed: true,
            }),
          );
        },
      });
      this._gestureCleanups.push(dispose);
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const c of this._gestureCleanups) c();
    this._gestureCleanups = [];
  }

  private _onRemove = (idx: number) => (ev: Event): void => {
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('remove-color', { detail: { index: idx }, bubbles: true, composed: true }),
    );
  };

  private _onAdd = (ev: Event): void => {
    ev.stopPropagation();
    this.dispatchEvent(new CustomEvent('add-current', { bubbles: true, composed: true }));
  };

  private _onSwatchTapInEdit = (idx: number) => (ev: Event): void => {
    if (!this.editMode) return;
    // In edit-mode, tapping a swatch (not the - button) does nothing -
    // dragging or removing is the only flow. Stop propagation so the
    // overlay-backdrop click-out handler doesn't dismiss the picker.
    ev.stopPropagation();
  };

  protected render(): TemplateResult {
    return html`
      <div class="frame">
        <div class="grid ${this.editMode ? 'editing' : ''}">
          ${this.colors.map(
            (c, idx) => html`
              <div
                class="swatch"
                data-idx=${idx}
                style=${`background: rgb(${c[0]}, ${c[1]}, ${c[2]});`}
                @click=${this._onSwatchTapInEdit(idx)}
              >
                ${this.editMode
                  ? html`
                      <button
                        class="remove"
                        type="button"
                        aria-label="Remove color"
                        @click=${this._onRemove(idx)}
                      >
                        <svg viewBox="0 0 24 24" class="g">
                          <line x1="6" y1="12" x2="18" y2="12"></line>
                        </svg>
                      </button>
                    `
                  : null}
              </div>
            `,
          )}
          ${this.editMode
            ? html`
                <button class="add" type="button" aria-label="Save current color" @click=${this._onAdd}>
                  <svg viewBox="0 0 24 24" class="g">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              `
            : null}
        </div>
      </div>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
    }
    .frame {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 56px);
      grid-auto-rows: 56px;
      gap: 12px;
      justify-content: center;
    }
    .swatch {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      touch-action: none;
      transition: transform 120ms ease-out;
    }
    .swatch:hover {
      transform: scale(1.06);
    }
    .grid.editing .swatch {
      animation: wiggle 480ms cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
    }
    /* Stagger so adjacent swatches don't wiggle in lock-step. */
    .grid.editing .swatch:nth-child(2n) { animation-delay: 80ms; }
    .grid.editing .swatch:nth-child(3n) { animation-delay: 160ms; }
    .grid.editing .swatch:nth-child(4n) { animation-delay: 240ms; }
    @keyframes wiggle {
      0%, 100% { transform: rotate(-1.4deg); }
      50%      { transform: rotate(1.4deg); }
    }
    .remove {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: var(--error-color, #c62828);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      z-index: 2;
    }
    .remove:hover {
      background: #e53935;
    }
    .add {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px dashed rgba(255, 255, 255, 0.35);
      background: transparent;
      color: var(--secondary-text-color, #b1b3c8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .add:hover {
      border-color: rgba(255, 255, 255, 0.6);
      color: var(--primary-text-color, #fff);
    }
    .done {
      align-self: flex-end;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: transparent;
      color: var(--state-light-active-color, #f88d2a);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .done:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .g {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .add .g {
      width: 22px;
      height: 22px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-saved-colors-picker': EverydaySavedColorsPicker;
  }
}
